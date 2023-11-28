import { Client, TLSMode } from 'https://deno.land/x/mysql@v2.12.1/mod.ts'
import type { TLSConfig } from 'https://deno.land/x/mysql@v2.12.1/mod.ts'

import get_env from './env.ts'

export default async () => {
	const host = get_env('MYSQL_HOST')
	const local = host === '127.0.0.1' || host === 'localhost'

	const tls_config: TLSConfig = {
		mode: local ? TLSMode.DISABLED : TLSMode.VERIFY_IDENTITY,
		// caCerts: [
		//   await Deno.readTextFile("capath"),
		// ],
	}
	try {
		return await new Client().connect({
			hostname: get_env('MYSQL_HOST'),
			username: get_env('MYSQL_USER'),
			db: get_env('MYSQL_DB'),
			password: get_env('MYSQL_PASSWORD'),
			tls: tls_config,
		})
	} catch (err) {
		console.error('Error when connecting to mysql database:', err.message)
		throw err
	}
}
