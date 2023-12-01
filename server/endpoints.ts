import type { Routes } from './router.ts'
import jv from '../shared/json_validator.ts'
import { endpoint } from './endpoint_type.ts'

export default {
	'invoice_anonymous': {
		POST: endpoint({
			body_validator: jv.null,
			fn: (_req, context) => {
				console.log('query params:', context.query_params)

				return new Response('got it')
			},
		}),
	},
} satisfies Routes
