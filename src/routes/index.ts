import { Router } from 'koa-x-router';

export const globalRouter = new Router();
globalRouter.get('/ping', async (ctx: any) => {
    ctx.body = 'pong';
});
