// deno-lint-ignore-file no-explicit-any
import type { MysqlHelpersObject } from './util/mysql_helpers_object.ts'
import sql from './util/sql_tagged_template.ts'

export type Context = {
	request: Request
	mysql: MysqlHelpersObject
}

const api = {
	invoice_anonymous: {
		async create({ mysql }: Context) {
			const uuid = crypto.randomUUID()

			const invoice_anonymous_id = await mysql.query(sql`
				INSERT INTO invoice_anonymous
					SET uuid = ${uuid}
			`).get_insert_id()

			return {
				invoice_anonymous_id,
				uuid,
			}
		},
	},
	invoice_line_item_anonymous: {
		async create(
			{ mysql }: Context,
			{ invoice_uuid, description }: { invoice_uuid: string; description: string },
		) {
			const invoice_line_item_anonymous_id = await mysql.query(sql`
				INSERT INTO invoice_line_item_anonymous (invoice_anonymous, description)
				SET
					invoice_id = (SELECT invoice_id FROM invoice_anonymous WHERE uuid = ${invoice_uuid}),
					description = ${description}
			`).get_insert_id()

			return {
				invoice_line_item_anonymous_id,
			}
		},
	},
	async what_day_is_it({ mysql }: Context) {
		return await mysql.query(`SELECT CURDATE() AS today`).get_first_row_column(
			'today',
		)
	},
} as const satisfies {
	[prop: string]: ApiFunctionImplementation<any, any> | {
		[prop: string]: ApiFunctionImplementation<any, any>
	}
}

type ApiShape = {
	[prop: string]: ApiFunctionImplementation<any, any> | ApiShape
}

type ConsumableApiFunction<Arg, Response> = unknown extends Arg ? () => Promise<Response>
	: (arg: Arg) => Promise<Response>

type FirstArgumentType<T extends (arg: any, context: Context) => any> = T extends
	(arg: infer U, context: Context) => any ? U : never

type ApiFunctionImplementation<Arg, Response> =
	| ((context: Context) => Promise<Response>)
	| ((context: Context, arg: Arg) => Promise<Response>)

type ApiObject = typeof api

export type ConsumableApi = {
	[prop in keyof ApiObject]: ApiObject[prop] extends ApiFunctionImplementation<infer A, infer B>
		? ConsumableApiFunction<A, B>
		: {
			[prop2 in keyof ApiObject[prop]]: ApiObject[prop][prop2] extends
				ApiFunctionImplementation<infer A, infer B> ? ConsumableApiFunction<A, B>
				: never
		}
}

export default api
