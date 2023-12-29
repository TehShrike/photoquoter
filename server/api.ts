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

			await mysql.query(sql`
				INSERT INTO invoice_anonymous
					SET uuid = ${uuid}
			`)

			return {
				uuid,
			}
		},
		async get_line_items(
			{ mysql }: Context,
			{ invoice_anonymous_uuid }: { invoice_anonymous_uuid: string },
		) {
			return await mysql.query(sql`
				SELECT invoice_line_item_anonymous.description, invoice_line_item_anonymous.invoice_line_item_anonymous_id
				FROM invoice_anonymous
				JOIN invoice_line_item_anonymous USING(invoice_anonymous_id)
				WHERE invoice_anonymous.uuid = ${invoice_anonymous_uuid}
			`).get_rows() as {
				description: string
				invoice_line_item_anonymous_id: number
			}[]
		},
	},
	invoice_line_item_anonymous: {
		async create(
			{ mysql }: Context,
			{ invoice_anonymous_uuid, description }: {
				invoice_anonymous_uuid: string
				description: string
			},
		) {
			const invoice_line_item_anonymous_id = await mysql.query(sql`
				INSERT INTO invoice_line_item_anonymous
				SET
					invoice_anonymous_id = (
						SELECT invoice_anonymous_id
						FROM invoice_anonymous
						WHERE uuid = ${invoice_anonymous_uuid}
					),
					description = ${description}
			`).get_insert_id()

			return {
				invoice_line_item_anonymous_id,
				description,
			}
		},
		async get_with_images(
			{ mysql }: Context,
			{ invoice_anonymous_uuid, invoice_line_item_anonymous_id }: {
				invoice_anonymous_uuid: string
				invoice_line_item_anonymous_id: number
			},
		) {
			const invoice_line_item_anonymous = await mysql.query(sql`
				SELECT invoice_line_item_anonymous.description, invoice_line_item_anonymous.invoice_line_item_anonymous_id
				FROM invoice_anonymous
				JOIN invoice_line_item_anonymous USING(invoice_anonymous_id)
				WHERE invoice_anonymous.uuid = ${invoice_anonymous_uuid}
			`).get_first_row() as null | {
				description: string
				invoice_line_item_anonymous_id: number
			}

			if (invoice_line_item_anonymous === null) {
				return new Response('Not found', {
					status: 404,
				})
			}

			const invoice_line_item_anonymous_images = await mysql.query(sql`
				SELECT invoice_line_item_anonymous_image.*
				FROM invoice_line_item_anonymous_image
				WHERE invoice_line_item_anonymous_image.invoice_line_item_anonymous_id = ${invoice_line_item_anonymous_id}
			`).get_rows() as {
				invoice_line_item_anonymous_image_id: number
				image: ArrayBuffer
				mime_type: string
				invoice_line_item_anonymous_id: number
			}[]

			// TODO: make sure that the image is actually an ArrayBuffer and not a Blob or Buffer
			console.log('Images from mysql2:', invoice_line_item_anonymous_images)

			return {
				...invoice_line_item_anonymous,
				invoice_line_item_anonymous_images,
			}
		},
	},
	invoice_line_item_anonymous_image: {
		async create(
			{ mysql }: Context,
			{ invoice_anonymous_uuid, invoice_line_item_anonymous_id, image, mime_type }: {
				invoice_anonymous_uuid: string
				invoice_line_item_anonymous_id: number
				image: ArrayBuffer
				mime_type: string
			},
		) {
			console.log('Is image ArrayBuffer?', image instanceof ArrayBuffer)
			console.log('Heres the image I got', image)
			const invoice_line_item_anonymous_image_id = await mysql.query(sql`
				INSERT INTO invoice_line_item_anonymous_image
				SET
					invoice_line_item_anonymous_id = (
						SELECT invoice_line_item_anonymous_id
						FROM invoice_line_item_anonymous
						JOIN invoice_anonymous USING(invoice_anonymous_id)
						WHERE invoice_line_item_anonymous_id = ${invoice_line_item_anonymous_id}
							AND invoice_anonymous.uuid = ${invoice_anonymous_uuid}
					),
					image = ${image},
					mime_type = ${mime_type}
			`).get_insert_id()

			return {
				invoice_line_item_anonymous_image_id,
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
