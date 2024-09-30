import { Router } from 'koa-x-router';
import { register } from '../libs/metrics';

export const globalRouter = new Router();
globalRouter.get('/ping', async (ctx: any) => {
    ctx.body = 'pong';
});

globalRouter.get('/metrics', async (ctx: any) => {
    ctx.body = await register.metrics();
});
