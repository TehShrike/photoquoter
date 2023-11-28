import parse from './regex_param.ts'
import type { Validator } from '../shared/json_validator.ts'

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

type Context<T> = {
	body: T
	url: URL
	route_params: {
		[name: string]: string
	}
}
type Handler = (req: Request, context: Context<null>) => Response | Promise<Response>
type BodyHandler<T> = (req: Request, context: Context<T>) => Response | Promise<Response>
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

type BodyMethod = 'POST' | 'PUT' | 'PATCH'

type Validated<T> = T extends Validator<infer U> ? U : T

type BodyResponder<V extends Validator<unknown>> = {
	validator: V
	handler: BodyHandler<Validated<V>>
}

type Routes = {
	[route_path: string]: {
		[method in Exclude<Method, BodyMethod>]?: Handler
	}
} & {
	[route_path: string]: {
		// deno-lint-ignore no-explicit-any
		[method in BodyMethod]?: <V extends Validator<any>>() => BodyResponder<V>
	}
}

const default_404 = (_req: Request) =>
	new Response(`404 not found`, {
		status: 404,
	})

type RouteWithMatcher = {
	matcher: RouteMatcher
	method_map: Routes[keyof Routes]
}

const is_body_handler = (
	_route_handler: Handler | (() => BodyResponder<Validator<unknown>>),
	method: Method,
): _route_handler is () => BodyResponder<Validator<unknown>> =>
	method === 'POST' || method === 'PUT' || method === 'PATCH'

export default function create_router(
	routesToMethodMaps: Routes,
	prefix = '',
	not_found: Handler = default_404,
) {
	const routes = Object.entries(routesToMethodMaps).map(([routeString, method_map]) => {
		return {
			matcher: create_route_matcher(prefix + routeString),
			method_map,
		}
	})

	return async (req: Request) => {
		const url = new URL(req.url)

		const matched = find_matching_route_and_parse_params(routes, url.pathname)

		if (matched) {
			const method = req.method as Method
			const { params, method_map } = matched
			const unknown_handler = method_map[method]

			if (!unknown_handler) {
				return await not_found(req, { body: null, url, route_params: {} })
			}

			const its_a_body_handler = is_body_handler(unknown_handler, method)

			if (its_a_body_handler) {
				const { validator, handler } = unknown_handler()
				const content_type = req.headers.get('content-type')
				const body = (content_type && content_type.toLowerCase() === 'application/json')
					? await req.json()
					: null

				if (!validator.is_valid(body)) {
					return new Response(`Invalid body\n${validator.get_messages(body, 'body')}`, {
						status: 400,
					})
				}

				return await handler(req, {
					body,
					url,
					route_params: params,
				})
			}

			return await unknown_handler(req, {
				body: null,
				url,
				route_params: params,
			})
		} else {
			return await not_found(req, { body: null, url, route_params: {} })
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
