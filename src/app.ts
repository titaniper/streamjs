import * as Koa from 'koa';
import { errorHandlerMiddleware, requestLoggerMiddleware, uuidMiddleware } from './middlewares';
import { globalRouter } from './routes';

const app = new Koa();

// ====== Do not change the order of the following middlewares =======> @see https://github.com/Ecube-Labs/notification-service/pull/5
app.use(uuidMiddleware);
app.use(requestLoggerMiddleware);
app.use(errorHandlerMiddleware);

/**
 * Routes Middleware
 */
app.use(globalRouter.middleware());
// <===================================================================

export default app;
