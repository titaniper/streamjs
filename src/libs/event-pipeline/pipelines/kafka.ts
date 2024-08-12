import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { logger } from '../../logger';
import { EventPipeline } from '../pipeline';

class KafkaEventPipeline extends EventPipeline<EachMessagePayload> {
    private kafkaClient: Kafka;

    private kafkaProducer: Producer;

    private kafkaConsumer: Consumer;

    private subscribedTopics: string[];

    constructor(config: {
        name: string;
        topics: string[];
        kafka: {
            brokers: string[];
        };
    }) {
        super();
        this.kafkaClient = new Kafka({
            clientId: config.name,
            brokers: config.kafka.brokers,
        });
        this.kafkaProducer = this.kafkaClient.producer({ transactionalId: config.name });
        this.kafkaConsumer = this.kafkaClient.consumer({ groupId: config.name });
        this.subscribedTopics = config.topics;
    }

    async put(records: EachMessagePayload[]): Promise<void> {
        const transaction = await this.kafkaProducer.transaction();
        try {
            for (const record of records) {
                const sinkTopics = await this.getSinkTopics(record);
                if (sinkTopics.length) {
                    const processedMessage = await this.processMessage(record);
                    await Promise.all(
                        sinkTopics.map((topic) =>
                            this.kafkaProducer.send({
                                topic,
                                messages: [processedMessage.message],
                            }),
                        ),
                    );
                }
            }
            await transaction.commit();
        } catch (error) {
            await transaction.abort();
            logger.error('Transaction aborted due to error', { error });
            throw error;
        }
    }

    private async getSinkTopics(record: EachMessagePayload): Promise<string[]> {
        const topicsArrays = await Promise.all(this.routes.map((route) => route.process(record)));
        return Array.from(new Set<string>(topicsArrays.flat()));
    }

    private async processMessage(record: EachMessagePayload): Promise<EachMessagePayload> {
        let transformedRecord = record;
        for (const processor of this.processors) {
            transformedRecord = await processor.process(transformedRecord);
        }

        return transformedRecord;
    }

    async start(): Promise<void> {
        await Promise.all([this.kafkaProducer.connect(), this.kafkaConsumer.connect()]);
        await Promise.all([
            this.kafkaConsumer.subscribe({
                topics: this.subscribedTopics,
                fromBeginning: false,
            }),
            this.kafkaConsumer.run({
                eachMessage: async (payload) => {
                    await this.put([payload]);
                },
            }),
        ]);
    }

    async stop(): Promise<void> {
        await Promise.all([this.kafkaProducer.disconnect(), this.kafkaConsumer.disconnect()]);
    }
}

export { KafkaEventPipeline };
