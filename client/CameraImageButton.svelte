<script lang=ts>
	import image_url_to_image from "./image_url_to_image";

	export let data_url: string | null = null
	export let image: HTMLImageElement | null = null

	let image_input: HTMLInputElement

	const on_image_change = () => {
		const file = image_input.files[0]
		const reader = new FileReader()

		reader.onload = async (e) => {
			data_url = e.target.result as string

			image = await image_url_to_image(data_url)
		}

		reader.readAsDataURL(file)
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
