import mysql from 'npm:mysql2@^2.3.3/promise'
import type { ConnectionOptions } from 'npm:mysql2@^2.3.3/promise'
import type { Buffer } from 'node:buffer'

import get_env from './env.ts'

type MysqlDateTypes = 'TIMESTAMP' | 'DATETIME' | 'DATE'
const date_types_we_want_returned_as_strings: MysqlDateTypes[] = [`TIMESTAMP`, `DATETIME`, `DATE`]

type Field = {
	type: string
	length: number
	db: string
	table: string
	name: string
	string: () => string
	buffer: () => Buffer
	geometry: () => unknown
}

const time_types = new Set([`TIMESTAMP`, `DATETIME`])
const database_utc_offset = `Z`

const static_connection_options: ConnectionOptions = {
	multipleStatements: true,
	supportBigNumbers: true,
	timezone: `+00:00`,
	dateStrings: date_types_we_want_returned_as_strings,
	typeCast: (field: Field, next: () => unknown) => {
		if (field.type === `BIT` && field.length === 1) {
			const as_number = Array.from(field.buffer().values())[0]
			return as_number === 1 || as_number === 49 // also check if 49 (ASCII code for 1) because of this bug: https://bugs.mysql.com/bug.php?id=97067
		} else if (field.type === `NEWDECIMAL`) {
			const decimal_string = field.string()
			if (decimal_string === null) {
				return null
			}

			// TODO: return fnum(decimal_string)

			return decimal_string
		} else if (time_types.has(field.type)) {
			const datetime_string = field.string()
			if (datetime_string === null) {
				return null
			}
			return datetime_string.replace(` `, `T`) + database_utc_offset
		}

		return next()
	},
}

export default async () => {
	const host = get_env('MYSQL_HOST')
	const local = host === '127.0.0.1' || host === 'localhost'

	try {
		return await mysql.createPool({
			...static_connection_options,
			host,
			user: get_env('MYSQL_USER'),
			database: get_env('MYSQL_DB'),
			password: get_env('MYSQL_PASSWORD'),
			port: 3306,
			connectionLimit: 5,
			ssl: { rejectUnauthorized: !local },
		})
	} catch (err) {
		console.error('Error when connecting to mysql database:', err.message)
		throw err
	}
}
