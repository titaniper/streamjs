const clientId = process.env.KAFKA_CLIENT_ID || '';
const brokers = (process.env.KAFKA_BROKERS || '').split(',').filter(Boolean);

export const config = {
    server: {
        port: process.env.PORT || 3000,
    },
    kafka: {
        clientId,
        brokers,
    },
    podIndex: process.env.POD_INDEX ?? 0,
};
