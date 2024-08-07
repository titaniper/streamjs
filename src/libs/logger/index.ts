import * as winston from 'winston';
import type { Context } from 'koa';
import { koaEcsFormat } from 'koa-ecs-winston-format';

const isDev = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'stage';
// TODO: logging name 환경변수로 주입받을까?
const loggingName = ['KAFKA-EVENT-PIPELINE', process.env.NODE_ENV].filter(Boolean).join('-');

export const logger = winston.createLogger({
    transports: isDev
        ? [
              new winston.transports.Console({
                  format: winston.format.combine(winston.format.json(), winston.format.prettyPrint()),
                  level: 'error',
              }),
          ]
        : [
              new winston.transports.Console({
                  format: koaEcsFormat({ name: loggingName }),
              }),
          ],
});

export function getLoggingContext(context: Context, tags?: string[]) {
    return {
        tags,
        ctx: context,
        txId: context.state.txId,
    };
}
