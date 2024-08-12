import { EachMessagePayload } from 'kafkajs';

abstract class EventProcessor {
    abstract process(record: EachMessagePayload): Promise<EachMessagePayload>;
}

export { EventProcessor };
