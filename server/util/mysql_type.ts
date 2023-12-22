import type { FieldPacket, OkPacket, RowDataPacket } from 'npm:mysql2@^2.3.3/promise'

export type QueryResultSet = OkPacket & RowDataPacket[]

export type QueryPromise = Promise<[QueryResultSet, FieldPacket[]]>

export type Mysql = {
	query: (sql: string, values?: unknown[]) => QueryPromise
}
