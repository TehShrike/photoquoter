import esbuild from 'esbuild'
import svelte from 'esbuild-svelte'
import { typescript } from 'svelte-preprocess-esbuild'

const main = async ({ watch, dev }) => {
	const context = await esbuild.context({
		entryPoints: [{
			out: 'client_bundle',
			in: './index.ts',
		}],
		bundle: true,
		splitting: true,
		treeShaking: true,
		outdir: '../public/',
		platform: `browser`,
		format: `esm`,
		sourcemap: true,
		minify: !dev,
		define: {
			'env.environment': JSON.stringify(dev ? 'development' : 'production'),
		},
		plugins: [
			svelte({
				preprocess: [typescript({ tsconfig: `./tsconfig.json` })],
			}),
		],
	})

	await context.rebuild()

	if (watch) {
		await context.watch()
	} else {
		await context.dispose()
	}
}

const watch = process.argv.includes(`--watch`)

main({
	watch,
	dev: watch,
}).catch((e) => {
	console.error(e.message)
	process.exit(1)
})
