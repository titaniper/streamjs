import { EachMessagePayload } from 'kafkajs';

type EventRouterRule = {
    sourceTopic: string;
    filteringEvent?: string[];
    sinkTopic: string;
};

abstract class EventRouter {
    protected rules?: EventRouterRule[];

    constructor(config?: { rules?: EventRouterRule[] }) {
        this.rules = config?.rules;
    }

    abstract process(record: EachMessagePayload): Promise<string[]>;
}

export { EventRouter, EventRouterRule };
