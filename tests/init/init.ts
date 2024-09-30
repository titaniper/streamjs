const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['kafka-kafka-bootstrap.streaming.svc.cluster.local:9092'], 
});

const admin = kafka.admin();

async function createTopicIfNotExists(topic: any) {
  try {
    const topics = await admin.listTopics();
    if (!topics.includes(topic)) {
      await admin.createTopics({
        topics: [{ topic }],
      });
      console.log(`Topic ${topic} created successfully`);
    } else {
      console.log(`Topic ${topic} already exists`);
    }
  } catch (error) {
    console.error(`Error handling topic ${topic}:`, error);
  }
}

async function initTopics(topics: any) {
  for (const topic of topics) {
    await createTopicIfNotExists(topic);
  }
}

async function initCdcTopics() {
  const topics = ['debezium.ben.ddd_event', 'debezium.payment.ddd_event'];
  await initTopics(topics);
}

async function initInternalTopics() {
  const topics = ['ben.internal.event', 'payment.internal.event'];
  await initTopics(topics);
}

async function initExternalTopics() {
  const topics = ['ben.external.event', 'payment.external.event'];
  await initTopics(topics);
}

(async () => {
  try {
    await admin.connect();
    
    await initCdcTopics();
    await initInternalTopics();
    await initExternalTopics();
    
    console.log('All topics initialized successfully');
  } catch (error) {
    console.error('Error initializing topics:', error);
  } finally {
    await admin.disconnect();
  }
})();