/**
 * 1. prefix + 필터링 되어서 잘 전달되나
 * to: debezium.prefixA.ddd_event
2. prefix O
3. filter O
4. metadata x (null)
5. route ben.extenral.event
 */
export const internalKill = {
    schema: {
        type: 'struct',
        fields: [
            {
                type: 'struct',
                fields: [
                    {
                        type: 'int64',
                        optional: false,
                        field: 'id',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'type',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        name: 'io.debezium.time.Timestamp',
                        version: 1,
                        field: 'occurredAt',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'txId',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        name: 'io.debezium.time.MicroTimestamp',
                        version: 1,
                        default: 0,
                        field: 'createdAt',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        name: 'io.debezium.time.MicroTimestamp',
                        version: 1,
                        default: 0,
                        field: 'updatedAt',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'data',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'actorId',
                    },
                ],
                optional: true,
                name: 'debezium.haulla.ddd_event.Value',
                field: 'before',
            },
            {
                type: 'struct',
                fields: [
                    {
                        type: 'int64',
                        optional: false,
                        field: 'id',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'type',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        name: 'io.debezium.time.Timestamp',
                        version: 1,
                        field: 'occurredAt',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'txId',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        name: 'io.debezium.time.MicroTimestamp',
                        version: 1,
                        default: 0,
                        field: 'createdAt',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        name: 'io.debezium.time.MicroTimestamp',
                        version: 1,
                        default: 0,
                        field: 'updatedAt',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'data',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'actorId',
                    },
                ],
                optional: true,
                name: 'debezium.haulla.ddd_event.Value',
                field: 'after',
            },
            {
                type: 'struct',
                fields: [
                    {
                        type: 'string',
                        optional: false,
                        field: 'version',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'connector',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'name',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        field: 'ts_ms',
                    },
                    {
                        type: 'string',
                        optional: true,
                        name: 'io.debezium.data.Enum',
                        version: 1,
                        parameters: {
                            allowed: 'true,last,false,incremental',
                        },
                        default: 'false',
                        field: 'snapshot',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'db',
                    },
                    {
                        type: 'string',
                        optional: true,
                        field: 'sequence',
                    },
                    {
                        type: 'string',
                        optional: true,
                        field: 'table',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        field: 'server_id',
                    },
                    {
                        type: 'string',
                        optional: true,
                        field: 'gtid',
                    },
                    {
                        type: 'string',
                        optional: false,
                        field: 'file',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        field: 'pos',
                    },
                    {
                        type: 'int32',
                        optional: false,
                        field: 'row',
                    },
                    {
                        type: 'int64',
                        optional: true,
                        field: 'thread',
                    },
                    {
                        type: 'string',
                        optional: true,
                        field: 'query',
                    },
                ],
                optional: false,
                name: 'io.debezium.connector.mysql.Source',
                field: 'source',
            },
            {
                type: 'string',
                optional: false,
                field: 'op',
            },
            {
                type: 'int64',
                optional: true,
                field: 'ts_ms',
            },
            {
                type: 'struct',
                fields: [
                    {
                        type: 'string',
                        optional: false,
                        field: 'id',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        field: 'total_order',
                    },
                    {
                        type: 'int64',
                        optional: false,
                        field: 'data_collection_order',
                    },
                ],
                optional: true,
                name: 'event.block',
                version: 1,
                field: 'transaction',
            },
        ],
        optional: false,
        name: 'debezium.ben.ddd_event',
        version: 1,
    },
    payload: {
        before: null,
        after: {
            id: 1304926,
            type: 'KillEvent',
            occurredAt: 1721884234000,
            txId: 'd02352dd-9ea9-4ce8-a936-b83aec160e73',
            createdAt: 1721884234070590,
            updatedAt: 1721884234070590,
            metadata: '{"topic":"ben.internal.event","channel":"kafka"}',
            data: '{"id":"1"}',
            actorId: 'ow3QKY8hyY',
        },
        source: {
            version: '2.1.3.Final',
            connector: 'mysql',
            name: 'debezium',
            ts_ms: 1721884234000,
            snapshot: 'false',
            db: 'ben',
            sequence: null,
            table: 'ddd_event',
            server_id: 1132716479,
            gtid: null,
            file: 'mysql-bin-changelog.001162',
            pos: 125028869,
            row: 0,
            thread: 854067,
            query: null,
        },
        op: 'c',
        ts_ms: 1721884234076,
        transaction: null,
    },
};