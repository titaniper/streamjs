import { Kafka } from 'kafkajs';
import { eventPass } from '../events/external-pass';
import { eventTarget } from '../events/external-target';
import { eventTargetInternal } from '../events/external-target-internal';
import { internalMetadata } from '../events/internal-metadata';
import { internalNoMetadata } from '../events/internal-nometadata';

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
        value: JSON.stringify(eventPass), 
      },
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
      },
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
        value: JSON.stringify(internalNoMetadata), 
      },
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
        value: JSON.stringify(eventTarget), 
      },
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
        value: JSON.stringify(eventTargetInternal), 
      }
    ],
  })
}

run().catch(console.error)