import { Kafka } from 'kafkajs';
import { internalMetadata } from '../events/ben-general';

const brokers = [`kafka-kafka-bootstrap.streaming.svc.cluster.local:9092`]

const kafka = new Kafka({
  clientId: 'kafkajs-producer',
  brokers: brokers,
  ssl: false,
})

const producer = kafka.producer()

const run = async () => {
  // Producing
  await producer.connect()
  await producer.send({
    topic: 'debezium.ben.ddd_event',
    messages: [
      {
        headers: {
          name: 'test',
        },
        key: JSON.stringify({
          schema: {
              type: 'struct',
              fields: [
                  {
                      type: 'int64',
                      optional: false,
                      field: 'id',
                  },
              ],
              optional: false,
              name: 'debezium.ben.ddd_event.Key',
          },
          payload: {
              id: 1424821,
          },
        }),
        value: JSON.stringify(internalMetadata), 
      }
    ],
  })
}

run().catch(console.error)