import { ILog } from "../interface/iLog";
import { IObserver } from "../interface/iObserver";
import * as fs from 'fs';

//PATTERN: Observer 
export class FileLogger implements IObserver {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    public update(log: ILog): void {
        const logMessage = `${log.timestamp.toISOString()} [${log.level.toUpperCase()}] ${log.message}\n`;
        fs.appendFileSync(this.filePath, logMessage);
        console.log('FileLogger: Log written to file.');
    }
}
