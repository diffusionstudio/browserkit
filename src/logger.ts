import winston from 'winston';
import { LoggingWinston } from '@google-cloud/logging-winston';

import { GCP_PROJECT_ID } from './environment';

const transports: winston.transport[] = [new winston.transports.Console()];

if (GCP_PROJECT_ID) {
  transports.push(new LoggingWinston({
    projectId: GCP_PROJECT_ID,
  }));
}

export const logger = winston.createLogger({
  level: 'info',
  transports,
});
