import type { Routes } from './util/router.ts'
import jv from '../shared/json_validator.ts'
import { endpoint } from './endpoint_type.ts'
import sql from './util/sql_tagged_template.ts'

import type {
	InvoiceAnonymous,
	InvoiceLineItemAnonymous,
	InvoiceLineItemAnonymousImage,
} from './db_type.ts'

export default {
	'invoice_anonymous': {
		POST: endpoint({
			async fn({ return_json, mysql }) {
				const uuid = crypto.randomUUID()

				const { lastInsertId: invoice_anonymous_id } = await mysql.execute(sql`
					INSERT INTO invoice_anonymous
						SET uuid = ${uuid}
				`)

				return return_json({
					invoice_anonymous_id,
					uuid,
				})
			},
		}),
	},
	'invoice_line_item_anonymous/:invoice_uuid': {
		POST: endpoint({
			body_validator: jv.object({
				description: jv.string,
			}),
			async fn({mysql, return_json}) {

				return return_json({})
			}
		})
	}
} satisfies Routes
