// deno-lint-ignore-file no-explicit-any
import type { Client } from 'https://deno.land/x/mysql@v2.12.1/mod.ts'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type Endpoints = {
	[path: string]: {
		[method in HttpMethod]?: Endpoint<any, any, any>
	}
}

type MessageReturningFunction = (input: unknown, name: string) => string[]

type PredicateFunction<T> = (input: unknown) => input is T

export type BodyValidator<T> = {
	is_valid: PredicateFunction<T>
	get_messages: MessageReturningFunction
}

type ParamValidator<T> = (query_params: { [key: string]: string | string[] }) => T

// type ParamValidator<
// 	const DESIRED_OBJECT extends { [key: string]: any },
// 	const INPUT extends Partial<{ [key in keyof DESIRED_OBJECT]: string | string[] }>,
// > = ReturnType<typeof pv<DESIRED_OBJECT, INPUT>>

export type Context<BODY, QUERY_PARAMS, ROUTE_PARAMS> = {
	route_params: ROUTE_PARAMS
	query_params: QUERY_PARAMS
	body: BODY
	url: URL
	mysql: Client
}

type PvContents<T> = T extends ParamValidator<infer U> ? U : T
type BvContents<T> = T extends BodyValidator<infer U> ? U : T

export type Endpoint<
	BODY_VALIDATOR extends BodyValidator<any>,
	QUERY_PARAM extends ParamValidator<any>,
	ROUTE_PARAMS,
> = {
	body_validator?: BODY_VALIDATOR
	query_param_validator?: QUERY_PARAM
	route_param_validator?: ParamValidator<ROUTE_PARAMS>
	fn(
		req: Request,
		context: Context<
			BvContents<BODY_VALIDATOR>,
			PvContents<QUERY_PARAM>,
			ROUTE_PARAMS
		>,
	): Response | Promise<Response>
}

export const endpoint = <
	const BODY extends BodyValidator<any>,
	const QUERY_PARAMS extends ParamValidator<any>,
	const ROUTE_PARAMS,
>(endpoint: Endpoint<BODY, QUERY_PARAMS, ROUTE_PARAMS>) => endpoint
