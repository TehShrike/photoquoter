// deno-lint-ignore-file no-explicit-any
import type { Client } from 'https://deno.land/x/mysql@v2.12.1/mod.ts'

export type Context = {
	request: Request
	mysql: Client
}

const api = {
	some_endpoint: {
		async something_deeper({ value }: { value: string }, { mysql }: Context) {
			await console.log(value)
			return {
				some_value: 'oh yeah',
			}
		},
	},
	async some_other_endpoint({ wat }: { wat: boolean }, { mysql }: Context) {
		await console.log(wat)
		return {
			elsewhere: 'no',
		}
	},
} as const satisfies {
	[prop: string]: ApiFunctionImplementation<any, any> | {
		[prop: string]: ApiFunctionImplementation<any, any>
	}
}

type ApiShape = {
	[prop: string]: ApiFunctionImplementation<any, any> | ApiShape
}

type ConsumableApiFunction<Arg, Response> = (arg: Arg) => Promise<Response>

type FirstArgumentType<T extends (arg: any, context: Context) => any> = T extends
	(arg: infer U, context: Context) => any ? U : never

type ApiFunctionImplementation<Arg, Response> = (arg: Arg, context: Context) => Promise<Response>

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
