// @ts-expect-error the mysql2 types don't include createQuery, but mysql2 totally exports it
import { createQuery } from 'npm:mysql2'

import type { Connection } from 'npm:mysql2/promise'

import un_indent from './un_indent.ts'
import terminal_styles, { wrap_with_style, wrap_with_styles } from './terminal_styles.ts'

const log_query = (log_me: string, sql: string) => console.log(`========================= ${ log_me } =========================\n${ un_indent(sql) }`)

type MysqlError = Error & {
	code?: string // https://github.com/sidorares/node-mysql2/issues/1924
	errno: number
	sql: string
	sqlState: string
	sqlMessage: string
}

const is_mysql_error = (error: unknown): error is MysqlError => typeof error === `object`
	&& !!error
	&& `sql` in error
	&& typeof error.sql === `string`

export default () => {
	let next_query_number = 1

	return (mysql: Connection): Connection => Object.create(mysql, {
		query: {
			async value(input_sql: string, values?: unknown[]) {
				const log_me = `query ${ wrap_with_style(terminal_styles.yellow, next_query_number++) }`
				if (typeof input_sql === `string`) {
					log_query(log_me, input_sql)
				} else {
					const query = createQuery(input_sql, values, undefined, mysql.config)
					const sql = mysql.format(query.sql, query.values)
					log_query(log_me, sql)
				}
				const start = performance.now()
				try {
					return await mysql.query(input_sql, values)
				} catch (error) {
					if (is_mysql_error(error)) {
						console.error(
							wrap_with_style(terminal_styles.red, error.code || ``),
							wrap_with_style(terminal_styles.yellow, error.errno),
							wrap_with_style(terminal_styles.bold, error.sqlMessage)
						)
						console.error(wrap_with_style(terminal_styles.bright_red, un_indent(error.sql)))
					}

					throw error
				} finally {
					const end = performance.now()
					const query_ms = Math.round(end - start)
					const bg_color = query_ms < 50
						? terminal_styles.bg_green
						: query_ms < 100
							? terminal_styles.bg_bright_yellow
							: terminal_styles.bg_red

					const ms_styles = [ terminal_styles.bright_blue, terminal_styles.bold, bg_color ]
					console.log(`${ log_me } ran in ${ wrap_with_styles(ms_styles, query_ms) }ms`)
				}
			},
		},
	})
}
