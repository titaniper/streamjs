import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { logger } from '../../logger';
import { EventPipeline } from '../pipeline';
import { monitorKafkaJSConsumer, monitorKafkaJSProducer } from '@christiangalsterer/kafkajs-prometheus-exporter';
import { register } from '../../../libs/metrics';

class KafkaEventPipeline extends EventPipeline<EachMessagePayload> {
    private kafkaClient: Kafka;

    private kafkaProducer: Producer;

    private kafkaConsumer: Consumer;

    constructor(config: {
        name: string;
        topics?: string[];
        kafka: {
            brokers: string[];
        };
    }) {
        super();
        this.kafkaClient = new Kafka({
            clientId: config.name,
            brokers: config.kafka.brokers,
        });
        this.kafkaProducer = this.kafkaClient.producer({
            transactionalId: config.name,
            idempotent: true, // NOTE: 멱등성 기능 on.
            maxInFlightRequests: 1, // NOTE: 프로듀서가 최대 1개의 요청만 보낼 수 있도록 설정.
        });
        this.kafkaConsumer = this.kafkaClient.consumer({ groupId: config.name });
        if (config.topics) {
            this.addSubscribedTopics(config.topics);
        }

        // TODO: 개선
        monitorKafkaJSProducer(this.kafkaProducer, register, { defaultLabels: { name: config.name } })
        monitorKafkaJSConsumer(this.kafkaConsumer, register, { defaultLabels: { name: config.name } })

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
                            transaction.send({
                                topic,
                                messages: [processedMessage.message],
                            }),
                        ),
                    );
                }
            }
            await transaction.commit();
        } catch (err) {
            await transaction.abort();
            logger.error('Transaction aborted due to error', { err, tags: ['haulla', 'error'] });
            throw err;
        }
    }

    private async getSinkTopics(record: EachMessagePayload): Promise<string[]> {
        const topicsArrays = await Promise.all(this.routers.map((router) => router.process(record)));
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
        await this.kafkaProducer.connect();
        await this.kafkaConsumer.connect();
        await this.kafkaConsumer.subscribe({
            topics: this.subscribedTopics,
            fromBeginning: false,
        });
        await this.kafkaConsumer.run({
            eachMessage: async (payload) => {
                try {
                    await this.put([payload]);
                } catch (err) {
                    console.log("zz 죽네");
                    throw err;
                }
            },
        });
    }

    async stop(): Promise<void> {
        // NOTE: producer 연결을 먼저 끊어야 한다. @see https://github.com/Ecube-Labs/haulla/pull/1131#discussion_r1714603983
        await this.kafkaProducer.disconnect();
        await this.kafkaConsumer.disconnect();
    }
}

export { KafkaEventPipeline };
