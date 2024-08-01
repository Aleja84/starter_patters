import { ILog } from "../interface/iLog";
import { IObserver } from "../interface/iObserver";
import { ISubject } from "../interface/iSuject";

//PATTERN: Observer 
export class Logger implements ISubject {
    private observers: IObserver[] = [];

    public attach(observer: IObserver): void {
        const isExist = this.observers.includes(observer);
        if (isExist) {
            return console.log('Logger: Observer has been attached already.');
        }

        console.log('Logger: Attached an observer.');
        this.observers.push(observer);
    }

    public detach(observer: IObserver): void {
        const observerIndex = this.observers.indexOf(observer);
        if (observerIndex === -1) {
            return console.log('Logger: Nonexistent observer.');
        }

        this.observers.splice(observerIndex, 1);
        console.log('Logger: Detached an observer.');
    }

    public notify(log: ILog): void {
        console.log('Logger: Notifying observers...');
        for (const observer of this.observers) {
            observer.update(log);
        }
    }

    public log(level: 'info' | 'warning' | 'error', message: string): void {
        const log: ILog = { level, message, timestamp: new Date() };
        this.notify(log);
    }
}