import gracefulShutdown from 'http-graceful-shutdown';
import app from './app';
import { config } from './config';
import { KafkaEventPipeline } from './libs/event-pipeline/pipelines/kafka';
import { PrefixProcessor } from './libs/event-pipeline/processors';
import { ExternalDddEventRouter, InternalDddEventRouter } from './libs/event-pipeline/routers';

async function main() {
    const kafkaEventPipeline = await initKafkaEventPipeline();
    try {
        kafkaEventPipeline.start().catch((error) => {
            console.log('ererer222');
        });;
    } catch (error) {
        console.log('main gogo')
        throw error;
    }

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
            // NOTE: internal 재처리 하지 않도록
            'ben.internal.event',
            'debezium.external.filter.ddd_event',
            'debezium.external.nofilter.ddd_event',
            'debezium.kill.ddd_event',
        ],
        kafka: {
            brokers: config.kafka.brokers,
        },
    });

    eventPipeline.addProcessor(new PrefixProcessor([{ topic: 'debezium.external.filter.ddd_event', prefix: 'A' }]));
    eventPipeline.addRoute(new InternalDddEventRouter());
    eventPipeline.addRoute(new ExternalDddEventRouter({
        rules: [
            {
                sourceTopic: 'debezium.external.filter.ddd_event',
                filteringEvent: ['TargetEvent'],
                sinkTopic: 'ben.external.event',
            },
            {
                sourceTopic: 'debezium.external.nofilter.ddd_event',
                sinkTopic: 'ben.external.event',
            }
        ]
    }));

    return eventPipeline;
}

main();
