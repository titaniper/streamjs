import * as gracefulShutdown from 'http-graceful-shutdown';
import app from './app';
import { config } from './config';
import { KafkaEventPipeline } from './libs/event-pipeline/pipelines/kafka';
import { PrefixProcessor } from './libs/event-pipeline/processors';
import { ExternalDddEventRouter, InternalDddEventRouter } from './libs/event-pipeline/routers';

async function main() {
    const kafkaEventPipeline = await initKafkaEventPipeline();
    await kafkaEventPipeline.start();

    const port = config.server.port;
    const server = app.listen(port);

    gracefulShutdown(server, {
        signals: 'SIGINT SIGTERM',
        timeout: 30000,
        onShutdown: async () => {
            console.log('The server shuts down when the connection is cleaned up.');
            await kafkaEventPipeline.stop();
        },
        finally: () => {
            console.log('bye 👋');
            process.exit();
        },
    });

    console.log(`Server running on port ${port}`);
}

async function initKafkaEventPipeline() {
    const eventPipeline = new KafkaEventPipeline({
        name: config.kafka.clientId,
        topics: [
            'debezium.ben.ddd_event',
            'debezium.ben.all.ddd_event',
            'ben.internal.event',
            'debezium.prefixA.ddd_event',
            'debezium.prefixB.ddd_event',
            'debezium.kill.ddd_event',
        ],
        kafka: {
            brokers: config.kafka.brokers,
        },
    });

    eventPipeline.addProcessor(new PrefixProcessor([{ topic: 'debezium.prefixA.ddd_event', prefix: 'A' }, { topic: 'debezium.prefixB.ddd_event', prefix: 'B' }]));
    eventPipeline.addRoute(new InternalDddEventRouter());
    eventPipeline.addRoute(new ExternalDddEventRouter({
        rules: [
            {
                sourceTopic: 'debezium.ben.ddd_event',
                filteringEvent: ['ExternalEvent'],
                sinkTopic: 'ben.extenral.event',
            },
            {
                sourceTopic: 'debezium.ben.all.ddd_event',
                sinkTopic: 'ben.extenral.event',
            }
        ]
    }));

    return eventPipeline;
}

main();
