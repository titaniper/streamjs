import * as gracefulShutdown from 'http-graceful-shutdown';
import app from './app';
import { config } from './config';
import { KafkaConnect } from './libs/kafka/connect';

async function main() {
    const connect = await initKafkaConnect();
    await connect.start();

    const port = config.server.port;
    const server = app.listen(port);

    gracefulShutdown(server, {
        signals: 'SIGINT SIGTERM',
        timeout: 30000,
        onShutdown: async () => {
            console.log('The server shuts down when the connection is cleaned up.');
            await connect.stop();
        },
        finally: () => {
            console.log('bye 👋');
            process.exit();
        },
    });

    console.log(`Server running on port ${port}`);
}

async function initKafkaConnect() {
    return new KafkaConnect({
        name: config.kafka.clientId,
        kafka: {
            bootstraps: config.kafka.brokers,
        },
        connect: {
            topics: [
                'debezium.ben.ddd_event',
            ],
            route: {},
            transform: {
                prefix: {},
            },
        },
    });
}

main();
