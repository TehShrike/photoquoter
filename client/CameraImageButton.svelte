<script lang=ts>
	import { createEventDispatcher } from 'svelte'
	import assert from "./assert"
	import type { Image } from './line_item_types'

	const dispatch = createEventDispatcher()

	let image_input: HTMLInputElement

	const on_image_change = () => {
		const file = image_input.files[0]
		const reader = new FileReader()

		const mime_type = file.type

		reader.onload = async (e) => {
			const array_buffer = e.target.result
			assert(array_buffer instanceof ArrayBuffer)

			const image: Image = {
				image: array_buffer,
				mime_type
			}

			dispatch('new_image', image)
		}

		reader.readAsArrayBuffer(file)
	}
</script>

<label class=button>
	<slot></slot>
	<input
		type="file"
		accept="image/*"
		capture="environment"
		bind:this={image_input}
		on:change={on_image_change}
	>
</label>

<style>
	.button {
		background-color: lightgray;
		border: 1px solid black;
		border-radius: 3px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: sans-serif;
		font-size: 1em;
		font-weight: normal;
	}

	input[type=file] {
		display: none;
	}
</style>
