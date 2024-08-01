import { ILog } from "../interface/iLog";
import { IObserver } from "../interface/iObserver";

//PATTERN: Observer 
export class ErrorLogger implements IObserver {
    public update(log: ILog): void {
        if (log.level === 'error') {
            console.error(`${log.timestamp.toISOString()} [${log.level.toUpperCase()}] ${log.message}`);
        }
    }
}
