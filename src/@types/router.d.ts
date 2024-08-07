import type { Context } from '@ecubelabs/seed';
import type Joi from 'joi';
import type { RouteLayerSpec } from 'koa-x-router';

export type RouterSpec<
    V extends { output?: { [statusCode: string | number]: { body?: Joi.mappedSchema; header?: Joi.mappedSchema } } },
> = RouteLayerSpec<{ context: Context }, { body: Joi.extractType<V['output'][keyof V['output']]['body']> }>;

declare module 'koa-x-router' {
    interface Router {
        add(
            spec:
                | RouterSpec<unknown>
                | RouterSpec<unknown>[]
                | RouteLayerSpec<unknown, unknown>
                | RouteLayerSpec<unknown, unknown>[],
        ): void;
    }
}
