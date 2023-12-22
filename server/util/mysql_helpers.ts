import sql from './sql_tagged_template.ts'

import type { Mysql, QueryPromise } from './mysql_type.ts'
import map from './array_map.ts'

export const transaction = async <RESULT>(
	connection: Mysql,
	fn: () => Promise<RESULT>,
): Promise<RESULT> => {
	// deno-lint-ignore ban-types
	type MaybePool = Mysql & { beginTransaction: Function }
	if (typeof (connection as MaybePool).beginTransaction !== `function`) {
		throw new Error(`Tried to start a transaction using a connection pool`)
	}

	await connection.query(`START TRANSACTION`)
	try {
		const results = await fn()
		await connection.query(`COMMIT`)
		return results
	} catch (err) {
		await connection.query(`ROLLBACK`)
		throw err
	}
}

export const select_aliased_object = (
	table: string,
	table_ref: string,
	columns: string[],
	bit_columns: string[] = [],
) => {
	const bit_columns_set = new Set(bit_columns)
	return `IF(${table}.${table_ref} IS NULL, NULL, JSON_OBJECT(${
		columns.map((column) =>
			`'${column}', ${
				bit_columns_set.has(column)
					? `CAST(${table}.${column} AS UNSIGNED)`
					: `${table}.${column}`
			}`
		).join(`, `)
	}))`
}
export const select_object = (table: string, columns: string[]) =>
	select_aliased_object(table, `${table}_ref`, columns)

export const table_prefix = (table_name: string, column_names: string[]) =>
	column_names
		.map((column_name) => `${table_name}.${column_name}`)
		.join(`, `)

type Pojo = {
	[key: string]: unknown
}

type MysqlConnectionTableRows<T extends Pojo> = {
	mysql: Mysql
	table: string
	rows: Required<T>[]
}

type ValueOf<T> = T[keyof T]
type RowsAsArrays<T> = ValueOf<T>[][]

export const bulk_insert_arrays = <T extends Pojo>({
	mysql,
	table,
	column_property_names,
	rows,
	on_duplicate_key_update = [],
	insert_ignore,
}: Omit<MysqlConnectionTableRows<T>, 'rows'> & {
	column_property_names: string[]
	on_duplicate_key_update?: string | string[]
	insert_ignore?: boolean | undefined
	rows: RowsAsArrays<T>
}) => {
	if (rows.length === 0) {
		return
	}

	const ignore = insert_ignore ? `IGNORE` : ``

	const on_duplicate_update = on_duplicate_key_update.length === 0
		? ``
		: ` ON DUPLICATE KEY UPDATE ` + (Array.isArray(on_duplicate_key_update)
			? on_duplicate_key_update.map((column_name) =>
				`${column_name} = VALUES(${column_name})`
			).join(`, `)
			: on_duplicate_key_update)

	return mysql.query(
		`INSERT ${ignore} INTO ${table} (${
			column_property_names.map((column_name) => `"${column_name}"`).join(`, `)
		}) VALUES ?` + on_duplicate_update,
		[
			rows,
		],
	)
}

type BulkInsertArguments<T extends Pojo> = MysqlConnectionTableRows<T> & {
	on_duplicate_key_update?: string | string[] | undefined
	insert_ignore?: boolean | undefined
}

export const bulk_insert = <T extends Pojo>(
	{ mysql, table, rows, on_duplicate_key_update = [], insert_ignore }: BulkInsertArguments<T>,
) => {
	if (rows.length === 0) {
		return
	}

	const column_property_names = Object.keys(rows[0])

	return bulk_insert_arrays({
		mysql,
		table,
		column_property_names,
		rows: map(
			rows,
			(row_object) =>
				map(
					column_property_names,
					(property_name) => row_object[property_name],
				),
		),
		on_duplicate_key_update,
		insert_ignore,
	})
}

export const bulk_update = async <T extends Pojo>(
	{ mysql, table, rows }: MysqlConnectionTableRows<T>,
) => {
	if (rows.length === 0) {
		return
	}

	const update_queries = rows.map((row) => {
		const ref = row[table + `_ref`]
		if (typeof ref !== `number`) {
			throw new Error(`Invalid value for "${table}_ref": "${ref}"`)
		}

		return `UPDATE ${table} SET ? WHERE ${table}_ref = ${ref}`
	})

	await mysql.query(
		update_queries.join(`;\n`),
		rows,
	)
}

export const bulk_update_or_insert = async <T extends Pojo>(
	{ mysql, table, rows, on_duplicate_key_update, insert_ignore }: BulkInsertArguments<T>,
) => {
	const primary_key_column = table + `_ref`

	const initial_arrays: { rows_to_insert: T[]; rows_to_update: T[] } = {
		rows_to_insert: [],
		rows_to_update: [],
	}
	const { rows_to_insert, rows_to_update } = rows.reduce(
		({ rows_to_insert, rows_to_update }, row) => {
			if (primary_key_column in row) {
				rows_to_update.push(row)
			} else {
				rows_to_insert.push(row)
			}

			return {
				rows_to_update,
				rows_to_insert,
			}
		},
		initial_arrays,
	)

	await Promise.all([
		bulk_insert({ mysql, table, rows: rows_to_insert, on_duplicate_key_update, insert_ignore }),
		bulk_update({ mysql, table, rows: rows_to_update }),
	])
}

export const bulk_delete = async (
	{ mysql, table, refs }: { mysql: Mysql; table: string; refs: number[] },
) => {
	if (refs.length > 0) {
		await mysql.query(`DELETE FROM ${table} WHERE ${table}_ref` + sql` IN(${refs})`)
	}
}

export const get_column = (column: string, query_promise: QueryPromise) =>
	query_promise.then(([rows]) => rows.map((row) => row[column]))
export const get_first_row = (query_promise: QueryPromise) =>
	query_promise.then(([rows]) => rows.length === 0 ? null : rows[0])
export const get_first_row_column = (column: string, query_promise: QueryPromise) =>
	get_first_row(query_promise).then((row) => {
		if (row === null) {
			throw new Error(
				`Query returned no rows.  Cannot get column "${column}" from a non-existant row.`,
			)
		}
		return row[column]
	})
export const get_rows = (query_promise: QueryPromise) => query_promise.then(([rows]) => rows)
export const get_insert_id = (query_promise: QueryPromise) =>
	query_promise.then(([{ insertId }]) => insertId)
export const get_number_of_changed_rows = (query_promise: QueryPromise) =>
	query_promise.then(([{ changedRows }]) => changedRows) // number of rows that changed in an UPDATE.
export const get_number_of_affected_rows = (query_promise: QueryPromise) =>
	query_promise.then(([{ affectedRows }]) => affectedRows) // number of rows that were affected in an INSERT, UPDATE, or DELETE.  Includes rows matched in an UPDATE that did not change.
