import { Middleware } from 'koa';
import { ResponseError } from '../libs/response/error';
import { getLoggingContext, logger } from '../libs/logger';

interface TransformResponse {
    status: number;
    body: ResponseError;
}

const transformResponse = (err: Error): TransformResponse => {
    const rs: TransformResponse = {
        status: 500,
        body: {
            errorMessage: '',
        },
    };

    rs.body = {
        errorMessage: 'An unexpected error has occurred. Please try again.', // TODO: unexpected_error
    };
    return rs;
};

export const errorHandlerMiddleware: Middleware = async (ctx, next) => {
    try {
        await next();
    } catch (err: any) {
        const response = transformResponse(err);
        ctx.status = response.status;
        const { errorMessage } = response.body;

        ctx.body = {
            errorMessage: errorMessage ?? 'An unexpected error has occurred. Please try again.', // TODO: unexpected_error
        };

        logger
            .child(getLoggingContext(ctx, ['error']))
            .error(err.message ?? 'An unexpected error has occurred. Please try again.', { err });
    }
};
