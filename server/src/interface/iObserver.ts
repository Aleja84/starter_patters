import { ILog } from "./iLog";

//PATTERN: Observer 
export interface IObserver {
    // Receive update from subject.
    update(log: ILog): void;
}