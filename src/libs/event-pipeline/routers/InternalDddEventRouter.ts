import { EachMessagePayload } from 'kafkajs';
import { EventRouter } from '../router';

/**
 * NOTE: InternalDddEvent인 경우, metadata.topic으로 라우팅
 */
class InternalDddEventRouter extends EventRouter {
    async process(record: EachMessagePayload) {
        const { message, topic: sourceTopic } = record;
        if (message.value) {
            const kafkaMessage = JSON.parse(message.value.toString());
            const dddEvent = kafkaMessage.payload.after;
            const sinkTopics: string[] = [];
            if (dddEvent.metadata) {
                const metadata = JSON.parse(dddEvent.metadata);
                if (metadata.topic !== sourceTopic) {
                    sinkTopics.push(metadata.topic);
                }
            }

            return sinkTopics;
        }

        return [];
    }
}

export { InternalDddEventRouter };
