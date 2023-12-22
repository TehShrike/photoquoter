// deno-lint-ignore-file no-explicit-any
import type { Connection, RowDataPacket } from 'npm:mysql2@^2.3.3/promise'
import type { QueryPromise } from './mysql_type.ts'

import {
	get_column,
	get_first_row,
	get_first_row_column,
	get_insert_id,
	get_number_of_affected_rows,
	get_number_of_changed_rows,
	get_rows,
} from './mysql_helpers.ts'

const make_handy_result_object = (query_promise: QueryPromise) => {
	const then: PromiseLike<null>['then'] = (on_fulfilled?, on_rejected?) =>
		query_promise.then(() => null).then(on_fulfilled, on_rejected)

	return {
		get_column: <T = string>(column: string) => get_column(column, query_promise) as Promise<T[]>,
		get_first_row: <T = RowDataPacket>() => get_first_row(query_promise) as Promise<T>,
		get_first_row_column: <T = string>(column: string) =>
			get_first_row_column(column, query_promise) as Promise<T>,
		get_rows: <T = RowDataPacket>() => get_rows(query_promise) as unknown as Promise<T[]>,
		get_insert_id: () => get_insert_id(query_promise),
		get_number_of_changed_rows: () => get_number_of_changed_rows(query_promise),
		get_number_of_affected_rows: () => get_number_of_affected_rows(query_promise),
		then,
	}
}

type Values = any[] | { [param: string]: any }
const make_mysql_helpers_object = (mysql: Connection) => ({
	// Ideally we would use Parameters<Connection['query']>
	// However, there's a bug with mysql2 or typescript where it doesn't like our definition using rest args, or something
	// https://github.com/sidorares/node-mysql2/pull/1802
	// query: (...args: Parameters<Connection['query']>) => make_handy_result_object(mysql.query(...args)),
	// So until that's fixed, I'm using my silly definition:
	query: (sql: { sql: string; values?: Values } | string, values?: Values) =>
		make_handy_result_object(mysql.query(
			// @ts-expect-error the mysql2 types are annoying
			sql,
			values,
		)),
	connection: mysql,
})

export type MysqlHelpersObject = ReturnType<typeof make_mysql_helpers_object>

export default make_mysql_helpers_object
