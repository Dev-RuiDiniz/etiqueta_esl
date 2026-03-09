import pino from 'pino';

export function createLogger(config) {
  return pino({
    level: config.logLevel,
    base: {
      service: 'esl-bff'
    },
    timestamp: pino.stdTimeFunctions.isoTime
  });
}
