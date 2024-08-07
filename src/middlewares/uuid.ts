import type { Middleware } from 'koa';
import { v4 } from 'uuid';

export const uuidMiddleware: Middleware = async (ctx, next) => {
    ctx.state.txId = ctx.headers['x-request-id'] || v4();
    await next();
};
