import { EachMessagePayload } from 'kafkajs';
import { EventProcessor, EventProcessorRule } from '../processor';

interface PrefixDddEventProcessorRule extends EventProcessorRule {
    topic: string;
    prefix: string;
}

class PrefixDddEventProcessor extends EventProcessor {
    private rules: Map<string, string>;

    constructor(config: { rules: PrefixDddEventProcessorRule[] }) {
        super();
        this.rules = new Map(config.rules.map((rule) => [rule.topic, rule.prefix]));
    }

    async process(record: EachMessagePayload) {
        const { message, topic } = record;
        if (message.value) {
            const kafkaMessage = JSON.parse(message.value.toString());
            const dddEvent = kafkaMessage.payload.after;
            console.log('dddEvent', dddEvent);
            if (dddEvent.type === 'KillEvent') {
                throw new Error('KillEvent');
            }

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

export { PrefixDddEventProcessor, PrefixDddEventProcessorRule };
