import { Kafka } from 'kafkajs';
import { eventPass } from '../events/external-pass';
import { eventTarget } from '../events/external-target';

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
    topic: 'debezium.external.filter.ddd_event',
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
      value: JSON.stringify(eventPass), 
    }, {
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
      value: JSON.stringify(eventTarget), 
    }],
    // compression: CompressionTypes.ZSTD,
  })

  await producer.send({
    topic: 'debezium.external.nofilter.ddd_event',
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
      value: JSON.stringify(eventPass), 
    }, {
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
      value: JSON.stringify(eventTarget), 
    }],
    // compression: CompressionTypes.ZSTD,
  })
}

run().catch(console.error)