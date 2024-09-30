import gracefulShutdown from 'http-graceful-shutdown';
import { Registry, collectDefaultMetrics } from "prom-client";
import { monitorKafkaJSProducer, monitorKafkaJSConsumer, monitorKafkaJSAdmin } from "@christiangalsterer/kafkajs-prometheus-exporter";
import app from './app';
import { config } from './config';
import { KafkaEventPipeline } from './libs/event-pipeline/pipelines/kafka';
import { PrefixDddEventProcessor, PrefixDddEventProcessorRule } from './libs/event-pipeline/processors';
import { ExternalDddEventRouter, InternalDddEventRouter } from './libs/event-pipeline/routers';
import { EventRouterRule, EventProcessorRule } from './libs/event-pipeline';

async function main() {
    try {
        const kafkaEventPipeline = await initEventPipelines();
        for (const pipeline of kafkaEventPipeline) {
            await pipeline.start();
        }

        const port = config.server.port;
        const server = app.listen(port);

        gracefulShutdown(server, {
            signals: 'SIGINT SIGTERM',
            timeout: 30000,
            onShutdown: async () => {
                console.log('The server shuts down when the connection is cleaned up.');
                for (const pipeline of kafkaEventPipeline) {
                    await pipeline.stop();
                }
            },
            finally: () => {
                console.log('bye 👋');
                process.exit();
            },
        });

        console.log(`Server running on port ${port}`);
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

async function initEventPipelines() {
    const eventPipelines = [];

    switch (config.podIndex) {
        case 0: {
            eventPipelines.push(
                initKafkaEventPipeline({
                    kafka: {
                        groupId: `internal`,
                        brokers: config.kafka.brokers,
                    },
                    topics: ['debezium.ben.ddd_event', 'debezium.payment.ddd_event'],
                    processors: [],
                    routers: [
                        {
                            name: 'InternalDddEventRouter',
                            rules: [
                                {
                                    sourceTopic: 'debezium.ben.ddd_event',
                                    sinkTopic: 'ben.internal.event',
                                },
                                {
                                    sourceTopic: 'debezium.payment.ddd_event',
                                    sinkTopic: 'payment.internal.event',
                                },
                            ],
                        },
                    ],
                }),
            )
            break;
        }
        default: {
            eventPipelines.push(
                initKafkaEventPipeline({
                    kafka: {
                        groupId: `external`,
                        brokers: config.kafka.brokers,
                    },
                    topics: ['debezium.ben.ddd_event', 'debezium.payment.ddd_event'],
                    processors: [
                        {
                            name: 'PrefixDddEventProcessor',
                            rules: [
                                { topic: 'debezium.ben.ddd_event', prefix: 'Ben' },
                                { topic: 'debezium.payment.ddd_event', prefix: 'Payment' },
                            ],
                        },
                    ],
                    routers: [
                        {
                            name: 'ExternalDddEventRouter',
                            rules: [
                                {
                                    sourceTopic: 'debezium.payment.ddd_event',
                                    filteringEvent: ['GeneralEvent'],
                                    sinkTopic: 'ben.external.event',
                                },
                                {
                                    sourceTopic: 'debezium.ben.ddd_event',
                                    filteringEvent: ['GeneralEvent', 'KillEvent'],
                                    sinkTopic: 'payment.external.event',
                                },
                            ],
                        },
                    ],
                }),
            )
        }
    }

    return eventPipelines;
}

function initKafkaEventPipeline({
    kafka,
    topics,
    processors,
    routers,
}: {
    kafka: { groupId: string; brokers: string[] };
    topics: string[];
    processors: { name: 'PrefixDddEventProcessor'; rules: EventProcessorRule[] }[];
    routers: { name: 'InternalDddEventRouter' | 'ExternalDddEventRouter'; rules: EventRouterRule[] }[];
}) {
    const eventPipeline = new KafkaEventPipeline({
        name: kafka.groupId,
        topics,
        kafka: {
            brokers: kafka.brokers,
        },
    });
    for (const { name, rules } of processors) {
        eventPipeline.addProcessor(
            (() => {
                switch (name) {
                    case 'PrefixDddEventProcessor':
                        return new PrefixDddEventProcessor({ rules: rules as PrefixDddEventProcessorRule[] });
                    default:
                        throw new Error('Invalid processor');
                }
            })(),
        );
    }
    for (const { name, rules } of routers) {
        eventPipeline.addRouter(
            (() => {
                switch (name) {
                    case 'InternalDddEventRouter':
                        return new InternalDddEventRouter();
                    case 'ExternalDddEventRouter':
                        return new ExternalDddEventRouter({ rules });
                    default:
                        throw new Error('Invalid router');
                }
            })(),
        );
    }

    return eventPipeline;
}

main();
