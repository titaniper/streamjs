import gracefulShutdown from 'http-graceful-shutdown';
import axios from 'axios';
import app from './app';
import { config } from './config';
import { KafkaEventPipeline } from './libs/event-pipeline/pipelines/kafka';
import { PrefixDddEventProcessor, PrefixDddEventProcessorRule } from './libs/event-pipeline/processors';
import { ExternalDddEventRouter, InternalDddEventRouter } from './libs/event-pipeline/routers';
import { EventRouterRule, EventProcessorRule } from './libs/event-pipeline';

async function main() {
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
}

async function initEventPipelines() {
    const eventPipelines = [];

    switch (config.podIndex) {
        case 0: {
            eventPipelines.push(
                initKafkaEventPipeline({
                    kafka: {
                        groupId: `${config.name}-haulla`,
                        brokers: config.kafka.brokers,
                    },
                    topics: ['debezium.haulla.ddd_event', 'debezium.tycoon.ddd_event', 'debezium.payment.ddd_event'],
                    processors: [
                        {
                            name: 'PrefixDddEventProcessor',
                            rules: [
                                { topic: 'debezium.tycoon.ddd_event', prefix: 'Dashboard' },
                                { topic: 'debezium.payment.ddd_event', prefix: 'Payment' },
                                { topic: 'debezium.hubspot.event', prefix: 'Hubspot' },
                                { topic: 'debezium.ccnetworks.domain_event', prefix: 'Ccn' },
                            ],
                        },
                    ],
                    routers: [
                        {
                            name: 'ExternalDddEventRouter',
                            rules: [
                                {
                                    sourceTopic: 'debezium.tycoon.ddd_event',
                                    filteringEvent: ['UserCreatedEvent', 'UserUpdatedEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                                {
                                    sourceTopic: 'debezium.payment.ddd_event',
                                    filteringEvent: ['InvoiceFinalizedEvent', 'PaymentMethodEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                                {
                                    sourceTopic: 'debezium.hubspot.event',
                                    filteringEvent: ['DealUpdatedEvent', 'TicketUpdatedEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                                {
                                    sourceTopic: 'debezium.ccnetworks.domain_event',
                                    filteringEvent: ['ClientLogDetectedEvent', 'ClientVolumeUpdatedEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                            ],
                        },
                    ],
                }),
            );
            eventPipelines.push(
                initKafkaEventPipeline({
                    kafka: {
                        groupId: `${config.name}-haulla`,
                        brokers: config.kafka.brokers,
                    },
                    topics: ['debezium.haulla.ddd_event', 'debezium.tycoon.ddd_event'],
                    processors: [],
                    routers: [
                        {
                            name: 'InternalDddEventRouter',
                        },
                    ],
                }),
            );

            // 1. topic 이랑 파이프라인을 어떻게 짤지
            // 2. pipeline 

            eventPipelines.push(
                initKafkaEventPipeline({
                    kafka: {
                        groupId: `${config.name}-tycoon`,
                        brokers: config.kafka.brokers,
                    },
                    topics: ['debezium.haulla.tycoon'],
                    processors: [
                        {
                            name: 'PrefixDddEventProcessor',
                            rules: [
                                { topic: 'debezium.tycoon.ddd_event', prefix: 'Dashboard' },
                                { topic: 'debezium.payment.ddd_event', prefix: 'Payment' },
                                { topic: 'debezium.hubspot.event', prefix: 'Hubspot' },
                                { topic: 'debezium.ccnetworks.domain_event', prefix: 'Ccn' },
                            ],
                        },
                    ],
                    routers: [
                        {
                            name: 'InternalDddEventRouter',
                            rules: [],
                        },
                        {
                            name: 'ExternalDddEventRouter',
                            rules: [
                                {
                                    sourceTopic: 'debezium.tycoon.ddd_event',
                                    filteringEvent: ['UserCreatedEvent', 'UserUpdatedEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                                {
                                    sourceTopic: 'debezium.payment.ddd_event',
                                    filteringEvent: ['InvoiceFinalizedEvent', 'PaymentMethodEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                                {
                                    sourceTopic: 'debezium.hubspot.event',
                                    filteringEvent: ['DealUpdatedEvent', 'TicketUpdatedEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                                {
                                    sourceTopic: 'debezium.ccnetworks.domain_event',
                                    filteringEvent: ['ClientLogDetectedEvent', 'ClientVolumeUpdatedEvent'],
                                    sinkTopic: 'haulla.external.ddd_event',
                                },
                            ],
                        },
                    ],
                }),
            );
            break;
        }
        case 1: {
            // const haulerIds = await fetchHaulerIds(config.haulla.apiHost, config.haulla.accessToken);
            const haulerIds = ['7222259629'];
            eventPipelines.push(
                initKafkaEventPipeline({
                    kafka: {
                        groupId: `${config.name}-haulla-tenant`,
                        brokers: config.kafka.brokers,
                    },
                    topics: haulerIds.map((id) => `debezium.haulla-${id}.ddd_event`),
                    processors: [],
                    routers: [
                        {
                            name: 'InternalDddEventRouter',
                            rules: [],
                        },
                    ],
                }),
            );
            break;
        }
        default:
            break;
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

async function fetchHaulerIds(haullaHost: string, haullaAccessToken: string): Promise<string[]> {
    const { data } = await axios.get(`${haullaHost}/admins/haulers`, {
        headers: {
            Authorization: `Bearer ${haullaAccessToken}`,
            'x-city-id': '1',
            'x-region-id': '1',
        },
    });

    return data.data.filter((hauler: any) => hauler.isActive).map((hauler: any) => hauler.id);
}

main();
