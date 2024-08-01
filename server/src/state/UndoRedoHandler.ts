import { Server, Socket } from "socket.io";
import { Caretaker, Memento } from "../state/memento";
import { Database } from "../data/database";
import { Logger } from "../logger/logger";
import { List } from "../data/models/list";
import { MementoEvent } from "../common/enums/memento-event.enum";
import { SocketHandler } from "../handlers/socket.handler";
import { ReorderService } from "../services/reorder.service";
import { ListEvent } from "../common/enums/list-event.enum";

//PATTERN: Memento
class UndoRedoHandler extends SocketHandler{
  private caretaker: Caretaker<List[]>; 
  private logger: Logger;

  constructor(io: Server, caretaker: Caretaker<List[]>, reorderService: ReorderService,db: Database, logger: Logger) {
    super(io, db, reorderService);
    this.caretaker = caretaker;
    this.logger = logger;
  }

  public handleConnection(socket: Socket): void {
    socket.on(MementoEvent.UNDO, this.undo.bind(this));
    socket.on(MementoEvent.REDO, this.redo.bind(this));
  }

  public saveState(state: List[]): void {
    try {
     
      const currentState = state.map(list => list.clone()); 
      const memento = new Memento(currentState);
      this.caretaker.addMemento(memento);
    } catch (error) {
      this.logger.log('error', `Failed to save state: ${error.message}`);
    }
  }

  public undo(): void {
    try {
      const memento = this.caretaker.undo();
      if (memento) {
        this.db.setData(memento.getState());
        this.logger.log('info', 'Undo performed');
      }
      this.io.emit(ListEvent.UPDATE, this.db.getData());
    } catch (error) {
      this.logger.log('error', `Failed to undo: ${error.message}`);
    }
  }

  public redo(): void {
    try {
      const memento = this.caretaker.redo();
      if (memento) {
        this.db.setData(memento.getState());
        this.logger.log('info', 'Redo performed');
      }
      this.io.emit(ListEvent.UPDATE, this.db.getData());
    } catch (error) {
      this.logger.log('error', `Failed to redo: ${error.message}`);
    }
  }
}

export { UndoRedoHandler };
