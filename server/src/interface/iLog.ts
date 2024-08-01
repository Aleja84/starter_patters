export interface ILog {
    level: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
}