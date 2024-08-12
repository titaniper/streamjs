import { EachMessagePayload } from 'kafkajs';
import { EventRouter } from '../router';

/**
 * NOTE: ExternalDddEvent를 rule에 기반하여 메시지 라우팅.
 */
class ExternalDddEventRouter extends EventRouter {
    async process(record: EachMessagePayload) {
        const { message, topic } = record;
        if (message.value) {
            const kafkaMessage = JSON.parse(message.value.toString());
            const dddEvent = kafkaMessage.payload.after;
            const sinkTopics: string[] = [];
            const rule = this.rules?.find((rule) => rule.sourceTopic === topic);
            if (rule) {
                const { filteringEvent, sinkTopic } = rule;
                if (filteringEvent?.length) {
                    if (filteringEvent.includes(dddEvent.type)) {
                        sinkTopics.push(sinkTopic);
                    }
                } else {
                    sinkTopics.push(sinkTopic);
                }
            }

            return sinkTopics;
        }

        return [];
    }
}

export { ExternalDddEventRouter };
