import { resolve } from 'std/path/mod.ts'

import * as esbuild from 'https://deno.land/x/esbuild@v0.19.4/mod.js'

import svelte from 'https://esm.sh/esbuild-svelte@0.8.0'
import { typescript } from 'npm:svelte-preprocess-esbuild'

const watch = Deno.args.includes(`--watch`)

const build = async ({ inputDir, outputDir, filename, watch, dev }: {
	inputDir: string
	outputDir: string
	filename: string
	watch: boolean
	dev: boolean
}) => {
	console.log('watch:', watch)
	const context = await esbuild.context({
		entryPoints: [resolve(inputDir, filename)],
		bundle: true,
		splitting: true,
		treeShaking: true,
		outdir: outputDir,
		platform: `browser`,
		format: `esm`,
		sourcemap: true,
		minify: !dev,
		define: {
			'env.environment': JSON.stringify(dev ? 'development' : 'production'),
		},
		plugins: [
			svelte({
				preprocess: [typescript()],
			}),
		],
	})

	await context.rebuild()

	if (watch) {
		await context.watch()
	} else {
		console.log('disposing')
		await context.dispose()
	}
}

const main = async () => {
	const dev = watch
	await build({
		dev,
		watch,
		inputDir: './client/',
		filename: 'index',
		outputDir: './public/',
	})
	Deno.exit(0)
}

main().catch((e) => {
	console.error(`ERROR in editor/build-client.mjs`)
	console.error(e.message)
	Deno.exit(1)
})
