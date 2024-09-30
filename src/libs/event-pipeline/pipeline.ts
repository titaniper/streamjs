import { EventProcessor } from './processor';
import { EventRouter } from './router';

abstract class EventPipeline<T> {
    protected processors: EventProcessor[] = [];

    protected routers: EventRouter[] = [];

    protected subscribedTopics: string[] = [];

    abstract put(records: T[]): Promise<void>;

    abstract start(): Promise<void>;

    abstract stop(): Promise<void>;

    addProcessor(processor: EventProcessor) {
        this.processors.push(processor);
    }

    addRouter(router: EventRouter) {
        this.routers.push(router);
    }

    addSubscribedTopics(topics: string[]) {
        this.subscribedTopics = Array.from(new Set([...this.subscribedTopics, ...topics]));
    }
}

export { EventPipeline };
