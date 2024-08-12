import Koa from 'koa';
import { errorHandlerMiddleware, requestLoggerMiddleware, uuidMiddleware } from './middlewares';
import { globalRouter } from './routes';

const app = new Koa();

// ====== Do not change the order of the following middlewares =======> 
app.use(uuidMiddleware);
app.use(requestLoggerMiddleware);
app.use(errorHandlerMiddleware);

/**
 * Routes Middleware
 */
app.use(globalRouter.middleware());
// <===================================================================

export default app;
