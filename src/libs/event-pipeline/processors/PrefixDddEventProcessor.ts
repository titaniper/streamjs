import { EachMessagePayload } from 'kafkajs';
import { EventProcessor } from '../processor';

type PrefixRule = {
    topic: string;
    prefix: string;
};

class PrefixDddEventProcessor extends EventProcessor {
    private rules: Map<string, string>;

    constructor(rules: PrefixRule[]) {
        super();
        this.rules = new Map(rules.map((rule) => [rule.topic, rule.prefix]));
    }

    async process(record: EachMessagePayload) {
        const { message, topic } = record;
        if (message.value) {
            const kafkaMessage = JSON.parse(message.value.toString());
            const dddEvent = kafkaMessage.payload.after;
            const prefix = this.rules.get(topic);
            if (prefix) {
                const updatedMessage = {
                    ...kafkaMessage,
                    payload: {
                        ...kafkaMessage.payload,
                        after: {
                            ...dddEvent,
                            type: `${prefix}${dddEvent.type}`,
                        },
                    },
                };

                record.message.value = Buffer.from(JSON.stringify(updatedMessage));

                return record;
            }
        }

        return record;
    }
}

export { PrefixDddEventProcessor };
