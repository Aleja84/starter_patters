import type { Server, Socket } from "socket.io";

import { ListEvent } from "../common/enums/enums";
import { List } from "../data/models/list";
import { SocketHandler } from "./socket.handler";
import { Logger } from "../logger/logger";
import { FileLogger } from "../logger/fileLogger";
import { ErrorLogger } from "../logger/errorLogger";
import { ReorderService } from "../services/reorder.service";
import { ReorderServiceProxy } from "../proxy/reorderServiceProxy";
import { Caretaker } from "../state/memento";
import { UndoRedoHandler } from "../state/UndoRedoHandler";
import { Database } from "../data/database";

class ListHandler extends SocketHandler {

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
    this.fileLogger = new FileLogger('./src/log/app_list_handler.log');
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
    socket.on(ListEvent.CREATE, this.createList.bind(this));
    socket.on(ListEvent.GET, this.getLists.bind(this));
    socket.on(ListEvent.REORDER, this.reorderLists.bind(this));
    socket.on(ListEvent.DELETE, this.deleteList.bind(this));
    socket.on(ListEvent.RENAME, this.renameList.bind(this));
  }

  private getLists(callback: (cards: List[]) => void): void {
    callback(this.db.getData());
  }

  private reorderLists(sourceIndex: number, destinationIndex: number): void {
    try {
      console.log(sourceIndex, destinationIndex);

      const lists = this.db.getData();
      // PATTERN: Proxy
      const reorderedLists = this.reorderServiceProxy.reorder(
        lists,
        sourceIndex,
        destinationIndex
      );

      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(reorderedLists);
      this.updateLists();
      // PATTERN: Observer
      this.logger.log('info', `Lists reordered: ${JSON.stringify(reorderedLists)}`);
    } catch (error) {
      // PATTERN: Observer
      this.logger.log('error', `Failed to reorder lists: ${error.message}`);
    }
  }

  private createList(name: string): void {
    try {
      // PATTERN: Memento
      const lists = this.db.getData();
      const newList = new List(name);

      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(lists.concat(newList));
      this.updateLists();
      // PATTERN: Observer
      this.logger.log('info', `List created: ${name}`);
    } catch (error) {
      // PATTERN: Observer
      this.logger.log('error', `Failed to create list: ${error.message}`);
    }
  }

  private deleteList(listId: string): void {
    try {

      const lists = this.db.getData();
      const updatedLists = lists.filter(list => list.id !== listId);
      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists);
      this.db.setData(updatedLists);
      this.updateLists();
      // PATTERN: Observer
      this.logger.log('info', `List deleted: ${listId}`);
    } catch (error) {
      // PATTERN: Observer
      this.logger.log('error', `Failed to delete list: ${error.message}`);
    }
  }

  private renameList({ listId, listName }): void {
    try {
      const lists = this.db.getData();
      const updatedLists = lists.map(list =>
        list.id === listId ? list.setName(listName) : list);

      //PATTERN: Memento
      this.undoRedoHandler.saveState(lists)
      this.db.setData(updatedLists);
      this.updateLists();

      //PATTERN: Observer
      this.logger.log('info', `List renamed: ${listId}: ${listName}`);
    } catch (error) {
      // PATTERN: Observer
      this.logger.log('error', `Failed to rename list: ${error.message}`);
    }
  }

}

export { ListHandler };
