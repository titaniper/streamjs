import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { logger } from '../../libs/logger';

class KafkaConnect {
    private kafka!: Kafka;

    private producer!: Producer;

    private consumer!: Consumer;

    private topics!: string[];

    private route?: Record<
        string,
        {
            filter: string[];
            destination: string;
        }
    >;

    private prefix?: Record<string, string>;

    constructor(
        private config: {
            name: string;
            kafka: {
                bootstraps: string[];
            };
            connect: {
                topics: string[];
                route?: Record<
                    string,
                    {
                        filter: string[];
                        destination: string;
                    }
                >;
                transform?: {
                    prefix?: Record<string, string>;
                };
            };
        },
    ) {
        this.kafka = new Kafka({
            clientId: config.name,
            brokers: config.kafka.bootstraps,
        });
        this.producer = this.kafka.producer({ transactionalId: config.name });
        this.consumer = this.kafka.consumer({
            groupId: config.name,
        });
        this.topics = config.connect.topics;
        this.route = config.connect.route;
        this.prefix = config.connect.transform?.prefix;
    }

    private async put(records: EachMessagePayload[]): Promise<void> {
        const transactionalProducer = await this.producer.transaction();
        try {
            for (const record of records) {
                const { message, topic } = record;
                if (message.value) {
                    const kafkaMessage = JSON.parse(message.value.toString());
                    const dddEvent = kafkaMessage.payload.after;
                    const sinkTopics = this.getRoutes(topic, dddEvent);
                    const transformedDddEvent = this.transform(topic, dddEvent);
                    await Promise.all(
                        sinkTopics.map((topic) =>
                            this.producer.send({
                                topic,
                                messages: [
                                    {
                                        key: message.key,
                                        value: JSON.stringify({
                                            ...kafkaMessage,
                                            payload: {
                                                ...kafkaMessage.payload,
                                                after: transformedDddEvent,
                                            },
                                        }),
                                    },
                                ],
                            }),
                        ),
                    );
                }
            }

            await transactionalProducer.commit();
        } catch (err) {
            await transactionalProducer.abort();
            logger.error(err.message, { err, tags: ['error'] });
            throw err;
        }
    }

    private getRoutes(topic: string, dddEvent: any): string[] {
        const topics: string[] = [];
        // NOTE: KafkaEvent가 달려 있는 경우에는 해당 topic으로 전송
        if (dddEvent.metadata) {
            const metadata = JSON.parse(dddEvent.metadata);
            topics.push(metadata.topic);
        }

        // NOTE: Route에 정의된 topic이면 해당 destination으로 전송
        const route = this.route?.[topic];
        if (route) {
            const { filter, destination } = route;
            if (filter.length) {
                if (filter.includes(dddEvent.type)) {
                    topics.push(destination);
                }
            } else {
                topics.push(destination);
            }
        }

        return Array.from(new Set(topics));
    }

    private transform(topic: string, dddEvent: any): any {
        const prefix = this.prefix?.[topic];
        if (!prefix) {
            return dddEvent;
        }

        return {
            ...dddEvent,
            type: prefix ? `${prefix}${dddEvent.type}` : dddEvent.type,
        };
    }

    async start() {
        await this.producer.connect();
        await this.consumer.connect();
        await this.consumer.subscribe({
            topics: this.topics,
            fromBeginning: false,
        });
        await this.consumer.run({
            eachMessage: (payload) => this.put([payload]),
        });
    }

    async stop() {
        await this.producer.disconnect();
        await this.consumer.disconnect();
    }
}

export { KafkaConnect };
