// deno-lint-ignore-file no-explicit-any
import api from './api.ts'

type ApiFunctionImplementation<Arg, Response> = (arg: Arg, context: any) => Promise<Response>
type EndpointObject = {
	[prop: string]: ApiFunctionImplementation<any, any> | EndpointObject
}

type Shape = {
	[prop: string]: 'function' | Shape
}

const remove_functions_from_object = (obj: EndpointObject): Shape =>
	Object.fromEntries(
		Object.entries(obj).map(
			(
				[prop, value],
			) => [
				prop,
				typeof value === 'function' ? 'function' : remove_functions_from_object(value),
			],
		),
	)

const shape = remove_functions_from_object(api)

await Deno.writeTextFile(
	'./client/api_shape.ts',
	`export default ${JSON.stringify(shape, null, '\t')} as const`,
)
