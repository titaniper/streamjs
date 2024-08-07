import { Middleware } from 'koa';
import { getLoggingContext, logger } from '../libs/logger';

export const requestLoggerMiddleware: Middleware = async (ctx, next) => {
    const start = Date.now();

    try {
        await next();
    } finally {
        const duration = Date.now() - start;
        const txId = ctx.state?.txId;

        logger
            .child(getLoggingContext(ctx, ['request']))
            .info(`[${ctx.method}, ${txId}] -> ${ctx.url}\r\n<- ${ctx.status}, ${ctx.url} - ${duration}ms`);
    }
};
