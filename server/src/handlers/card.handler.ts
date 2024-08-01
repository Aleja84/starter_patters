import type { Server, Socket } from "socket.io";

import { CardEvent } from "../common/enums/enums";
import { Card } from "../data/models/card";
import { SocketHandler } from "./socket.handler";
import { ReorderService } from "../services/reorder.service";
import { ReorderServiceProxy } from "../proxy/reorderServiceProxy";
import { FileLogger } from "../logger/fileLogger";
import { ErrorLogger } from "../logger/errorLogger";
import { Logger } from "../logger/logger";
import { Caretaker } from "../state/memento";
import { List } from "../data/models/list";
import { UndoRedoHandler } from "../state/UndoRedoHandler";
import { Database } from "../data/database";
import { copyFileSync } from "fs";

class CardHandler extends SocketHandler {

  //PATTERN: Observer 
  private logger: Logger;
  private fileLogger: FileLogger;
  private errorLogger: ErrorLogger;

  //PATTERN: Proxy 
  protected reorderService: ReorderService;
  private reorderServiceProxy: ReorderServiceProxy;

  //PATTERN: Memento
  private caretaker: Caretaker<List[]>;
  private undoRedoHandler: UndoRedoHandler;
  
  constructor(io: Server, db: Database, reorderService: ReorderService, undoRedoHandler: UndoRedoHandler, caretaker: Caretaker<List[]>) {
    super(io, db, reorderService);

    //PATTERN: Observer
    this.logger = new Logger();
    this.fileLogger = new FileLogger('./src/log/app_card_handler.log');
    this.errorLogger = new ErrorLogger();
    this.logger.attach(this.fileLogger);
    this.logger.attach(this.errorLogger);

    //PATTERN: Proxy 
    this.reorderService = new ReorderService();
    this.reorderServiceProxy = new ReorderServiceProxy(this.reorderService, this.logger);

    //PATTERN: Memento
    this.caretaker = caretaker;
    this.undoRedoHandler = undoRedoHandler
  }

  public handleConnection(socket: Socket): void {
    socket.on(CardEvent.CREATE, this.createCard.bind(this));
    socket.on(CardEvent.REORDER, this.reorderCards.bind(this));
    socket.on(CardEvent.DELETE, this.deleteCard.bind(this));
    socket.on(CardEvent.DUPLICATE, this.duplicateCard.bind(this));
    socket.on(CardEvent.RENAME, this.renameCard.bind(this));
    socket.on(CardEvent.CHANGE_DESCRIPTION, this.updateCardDescription.bind(this));
    
  }

  public createCard({listId, name}): void {
    try {
      const lists = this.db.getData();
      const newCard = new Card(name, "");
      const updatedLists = lists.map((list) =>
        list.id === listId ? list.setCards(list.cards.concat(newCard)) : list
      );     
      
      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(updatedLists);
      this.updateLists();     
      
      //PATTERN: Observer
      this.logger.log('info', `Card created: ${JSON.stringify(updatedLists)}`);
    } catch (error) {

      //PATTERN: Observer
      this.logger.log("error", `Failed to create card: ${error.message}`);
    }
  }

  private reorderCards({
    sourceIndex,
    destinationIndex,
    sourceListId,
    destinationListId,
  }: {
    sourceIndex: number;
    destinationIndex: number;
    sourceListId: string;
    destinationListId: string;
  }): void {
    try {
      
      const lists = this.db.getData();
      //PATTERN: Proxy 
      const reordered = this.reorderServiceProxy.reorderCards({
        lists,
        sourceIndex,
        destinationIndex,
        sourceListId,
        destinationListId,
      });

      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(reordered);
      this.updateLists();

      
      //PATTERN: Observer
      this.logger.log('info', `Lists reordered: ${JSON.stringify(reordered)}`);
    } catch (error) {
      
      //PATTERN: Observer 
      this.logger.log('error', `Failed to reorder cards: ${error.message}`);
    }
  }

  public deleteCard({ listId, cardId }): void {
    try {
      const lists = this.db.getData();
      const updatedLists = lists.map((list) =>
        list.id === listId
          ? list.setCards(list.cards.filter((card) => card.id !== cardId))
          : list
      );

      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(updatedLists);
      this.updateLists();
      
      //PATTERN: Observer 
      this.logger.log('info', `Card deleted: ${JSON.stringify(updatedLists)}`);
    } catch (error) {
      //PATTERN: Observer 
      this.logger.log('error', `Failed to delete card: ${error.message}`);
    }
  }

  public duplicateCard({ listId, cardId }): void {
    try {
      const lists = this.db.getData();
      const updatedLists = lists.map((list) => {
        if (list.id === listId) {
          const card = list.cards.find((card) => card.id === cardId);
          if (card) {
            //PATTERN: Prototype
            const clonedCard = card.clone();
            return list.setCards(list.cards.concat(clonedCard));
          }
        }
        return list;
      });
      
      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(updatedLists);
      this.updateLists();
      
      //PATTERN: Observer 
      this.logger.log('info', `Card duplicated: ${JSON.stringify(updatedLists)}`);
    } catch (error) {
      //PATTERN: Observer 
      this.logger.log('error', `Failed to duplicate card: ${error.message}`);
    }
  }


  public renameCard({ listId, cardId, newName }): void {
    try {
      const lists = this.db.getData();
      const updatedLists = lists.map((list) => {
        if (list.id === listId) {
          const card = list.cards.find((card) => card.id === cardId);
          if (card) {
            card.setName(newName);
          }
        }
        return list;
      });
      
      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(updatedLists);
      this.updateLists();
      
      //PATTERN: Observer
      this.logger.log('info', `Card renamed: ${JSON.stringify(updatedLists)}`);
    } catch (error) {
      //PATTERN: Observer
      this.logger.log('error', `Failed to rename card: ${error.message}`);
    }
  }

  public updateCardDescription({ listId, cardId, newDescription }): void {
    try {
      const lists = this.db.getData();
      const updatedLists = lists.map((list) => {
        if (list.id === listId) {
          const card = list.cards.find((card) => card.id === cardId);
          if (card) {
            card.setDescription(newDescription);
          }
        }
        return list;
      });

      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(updatedLists);
      this.updateLists();
      
      //PATTERN: Observer
      this.logger.log('info', `Card description updated: ${JSON.stringify(updatedLists)}`);
    } catch (error) {
      //PATTERN: Observer
      this.logger.log('error', `Failed to update card description: ${error.message}`);
    }
  }

}

export { CardHandler };
