import { EventProcessor } from './processor';
import { EventRouter } from './router';

abstract class EventPipeline<T> {
    protected processors: EventProcessor[] = [];

    protected routes: EventRouter[] = [];

    abstract put(records: T[]): Promise<void>;

    abstract start(): Promise<void>;

    abstract stop(): Promise<void>;

    addProcessor(processor: EventProcessor) {
        this.processors.push(processor);
    }

    addRoute(route: EventRouter) {
        this.routes.push(route);
    }
}

export { EventPipeline };
