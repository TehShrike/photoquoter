import { load } from 'std/dotenv/mod.ts'

const env = await load()

export default (key: string) => key in env ? env[key] : Deno.env.get(key)
