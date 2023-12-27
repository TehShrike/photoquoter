<script lang=ts>
	import type { LineItem } from './line_item_types'
	import LineItemComponent from './LineItem.svelte'
	import { querystring_to_object, serialize_to_url } from './query_serialization'
	import pv from './param_validator';
	import assert from './assert'

	import read_querystring from './read_querystring';
   import api from './api_request';

   let line_items: null | LineItem[] = null

	let line_item_index: null | number = null
	let line_item: null | LineItem

	$: line_item = Number.isSafeInteger(line_item_index) ? line_items[line_item_index] : null

	const validate_params = pv({
		invoice_anonymous_uuid: pv.optional(pv.string),
		line_item_index: pv.optional(pv.integer),
	})

	const querystring_params = read_querystring(validate_params)

	type ExpectedParams = typeof querystring_params

	const init = async (params: ExpectedParams) => {
		let invoice_anonymous_uuid = params.invoice_anonymous_uuid
		if (!invoice_anonymous_uuid) {
			const { uuid } = await api.invoice_anonymous.create()
			invoice_anonymous_uuid = uuid
			serialize_to_url({
				invoice_anonymous_uuid
			})
		}

		line_items = await api.invoice_anonymous.get_line_items({invoice_anonymous_uuid})

		if (line_items.length === 0) {
			const line_item = await api.invoice_line_item_anonymous.create({ invoice_anonymous_uuid, description: '' })
			line_items.push(line_item)
			line_item_index = 0
		} else if (Number.isSafeInteger(params.line_item_index) && params.line_item_index >= 0 && params.line_item_index < line_items.length - 0) {
			line_item_index = params.line_item_index
		} else {
			line_item_index = 0
		}

		const line_item = line_items[line_item_index]

		serialize_to_url({
			line_item_index
		})

		let line_item_images = await api.invoice_line_item_anonymous.get_with_images({
			invoice_anonymous_uuid,
			invoice_line_item_anonymous_id: line_item.invoice_line_item_anonymous_id
		})

		console.log(line_item_images)
	}

	init(querystring_params)

</script>

{#if line_item}
	<LineItemComponent bind:line_item />
{/if}
