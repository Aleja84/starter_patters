import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { lists } from "./assets/mock-data";
import { Database } from "./data/database";
import { CardHandler, ListHandler } from "./handlers/handlers";
import { ReorderService } from "./services/reorder.service";
import { Caretaker } from "./state/memento";
import { Logger } from "./logger/logger";
import { UndoRedoHandler } from "./state/UndoRedoHandler";
import { List } from "./data/models/list";

const PORT = 3005;

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "https://starter-patternsv2-client-git-main-aleja84s-projects.vercel.app/",
    methods: ["GET", "POST"],
  },
});

const db = Database.Instance;
const reorderService = new ReorderService();

if (process.env.NODE_ENV !== "production") {
  db.setData(lists);
}

const caretaker = new Caretaker<List[]>();
const logger = new Logger();
const undoRedoHandler = new UndoRedoHandler(io, caretaker, reorderService, db, logger);

const onConnection = (socket: Socket): void => {
  new ListHandler(io, db, reorderService, undoRedoHandler, caretaker).handleConnection(socket);
  new CardHandler(io, db, reorderService, undoRedoHandler, caretaker).handleConnection(socket);
  undoRedoHandler.handleConnection(socket);
};

io.on("connection", onConnection);

httpServer.listen(PORT, () => console.log(`Listening on port: ${PORT}`));

export { httpServer };
