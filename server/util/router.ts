// deno-lint-ignore-file no-explicit-any
import parse from './regex_param.ts'
import type { Validator } from '../../shared/json_validator.ts'
import { assert } from 'std/assert/assert.ts'

const create_route_matcher = (routeString: string) => {
	const { keys, pattern } = parse(routeString)

	return (path: string) => {
		const matches = pattern.exec(path)

		if (!matches) {
			return null
		}

		return Object.fromEntries(
			keys.map((key, i) => [key, matches[i + 1] || '']),
		)
	}
}

type RouteMatcher = ReturnType<typeof create_route_matcher>

export type Handler<CONTEXT> = (context: CONTEXT) => Response | Promise<Response>

type Method =
	| 'GET'
	| 'HEAD'
	| 'POST'
	| 'PUT'
	| 'DELETE'
	| 'CONNECT'
	| 'OPTIONS'
	| 'TRACE'
	| 'PATCH'

type Validated<T> = T extends Validator<infer U> ? U : T

export type Routes = {
	[route_path: string]: {
		[method in Method]?: Handler<any> | {
			fn: Handler<any>
		}
	}
}

const default_404 = () =>
	new Response(`404 not found`, {
		status: 404,
	})

type RouteWithMatcher = {
	matcher: RouteMatcher
	method_map: Routes[keyof Routes]
}

export default function create_router<CONTEXT>(
	routesToMethodMaps: Routes,
	{
		prefix = '',
		not_found = default_404,
		route_executor,
	}: {
		prefix?: string
		not_found?: Handler<{ route_params: { [param: string]: string } }>
		route_executor: <
			ROUTE_OBJECT extends {
				fn: Handler<CONTEXT>
				route_params: { [param: string]: string }
			},
		>(
			req: Request,
			route: ROUTE_OBJECT,
		) => Response | Promise<Response>
	},
) {
	const routes = Object.entries(routesToMethodMaps).map(([routeString, method_map]) => {
		return {
			matcher: create_route_matcher(prefix + routeString),
			method_map,
		}
	})

	return async (req: Request): Promise<Response> => {
		const url = new URL(req.url)

		const matched = find_matching_route_and_parse_params(routes, url.pathname)

		if (matched) {
			const method = req.method as Method
			const { params, method_map } = matched
			const unknown_handler = method_map[method]

			assert(unknown_handler)

			const route_object = typeof unknown_handler === 'function'
				? { fn: unknown_handler }
				: unknown_handler

			const middleware_context = {
				...route_object,
				route_params: params,
			}

			return await route_executor(req, middleware_context)
		} else {
			return await not_found({ route_params: {} })
		}
	}
}

const return_first = <T, Return>(array: T[], predicate: (element: T) => Return | undefined) => {
	for (const element of array) {
		const value = predicate(element)

		if (value) {
			return value
		}
	}

	return null
}

const find_matching_route_and_parse_params = (routes: RouteWithMatcher[], path: string) =>
	return_first(routes, ({ matcher, ...rest }) => {
		const params = matcher(path)

		return params && {
			...rest,
			params,
		}
	})
