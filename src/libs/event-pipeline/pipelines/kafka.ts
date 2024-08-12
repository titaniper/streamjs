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
        console.log('KafkaEventPipeline constructor', {
            clientId: config.name,
            brokers: config.kafka.brokers,
        });
        this.kafkaClient = new Kafka({
            clientId: config.name,
            brokers: config.kafka.brokers,
            retry: {
                retries: 1,
            },
        });
        this.kafkaProducer = this.kafkaClient.producer({ transactionalId: config.name });
        this.kafkaConsumer = this.kafkaClient.consumer({ groupId: config.name, retry: {
            retries: 1,
        } });
        this.subscribedTopics = config.topics;
    }

    async put(records: EachMessagePayload[]): Promise<void> {
        const transaction = await this.kafkaProducer.transaction();
        try {
            for (const record of records) {
                const sinkTopics = await this.getSinkTopics(record);
                console.log('sinkTopics', sinkTopics);
                if (sinkTopics.length) {
                    const processedMessage = await this.processMessage(record);
                    console.log('processedMessage', processedMessage.message.value);
                    await Promise.all(
                        sinkTopics.map((topic) =>
                            transaction.send({
                                topic,
                                messages: [processedMessage.message],
                            }),
                        ),
                    );

                    // NOTE: 임시
                    const kafkaMessage = JSON.parse(record.message.value.toString());
                    const dddEvent = kafkaMessage.payload.after;
                    if (dddEvent.type === 'KillEvent') {
                        throw new Error('KillEvent');
                    }
                }
            }
            await transaction.commit();
        } catch (error) {
            await transaction.abort();
            console.log('error 1');
            // logger.error('Transaction aborted due to error', { error });
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
        // NOTE: 동시에 connect 하면 에러난다.
        // await Promise.all([this.kafkaProducer.connect(), await this.kafkaConsumer.connect()]);
        await this.kafkaProducer.connect();
        await this.kafkaConsumer.connect();

        // NOTE: run 먼저 할 수 없음
        //         signment":{},"groupProtocol":"RoundRobinAssigner","duration":8850}
        // KafkaJSNonRetriableError: Cannot subscribe to topic while consumer is running
        //     at Object.sub
        await this.kafkaConsumer.subscribe({
            topics: this.subscribedTopics,
            fromBeginning: false,
        });
        // https://github.com/tulios/kafkajs/blob/master/src/consumer/runner.js#L218
        this.kafkaConsumer.run({
            eachMessage: async (payload) => {
                try {
                    await this.put([payload]);
                } catch (error) {
                    console.log('rrrrr consome');
                    // throw new Error('💣')
                    throw error
                }
            },
        })
        // NOTE: 동작안함
        .catch((error) => {
            console.log('kafkaConsumer ererererer'); 
        });;
        // this.kafkaConsumer.on('error', (err) => {

        // });
    }

    async stop(): Promise<void> {
        await Promise.all([this.kafkaProducer.disconnect(), this.kafkaConsumer.disconnect()]);

    }
}

export { KafkaEventPipeline };
