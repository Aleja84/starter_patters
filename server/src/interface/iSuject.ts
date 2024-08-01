import { ILog } from "./iLog";
import { IObserver } from "./iObserver";

//PATTERN: Observer 
export interface ISubject {
    // Attach an observer to the subject.
    attach(observer: IObserver): void;

    // Detach an observer from the subject.
    detach(observer: IObserver): void;

    // Notify all observers about an event.
    notify(log: ILog): void;
}