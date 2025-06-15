import winston from 'winston';

export class Logger {
    private logger: winston.Logger;

    constructor(serviceName: string) {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            defaultMeta: { service: serviceName },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    ),
                }),
            ],
        });
    }

    public info(message: string, ...meta: any[]) {
        this.logger.info(message, ...meta);
    }

    public error(message: string, ...meta: any[]) {
        this.logger.error(message, ...meta);
    }

    public warn(message: string, ...meta: any[]) {
        this.logger.warn(message, ...meta);
    }
} 
