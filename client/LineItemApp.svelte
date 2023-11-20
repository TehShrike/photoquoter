<script lang=ts>
	import {create_new_line_item, type LineItem} from './line_item_types'
	import LineItemComponent from './LineItem.svelte'
	import { querystring_to_object } from './query_serialization'
	import pv from './param_validator';
	import assert from './assert'

	import {get_line_item_ids,get_line_item, set_line_item} from './local_storage'

	const validate_line_item_param = pv({
		line_item_number: pv.optional(pv.integer)
	})

	const line_item_ids = get_line_item_ids()

	console.log('line_item_ids:', line_item_ids)

	if (line_item_ids.length === 0) {
		const new_line_item = create_new_line_item()
		line_item_ids.push(new_line_item.id)
		set_line_item(new_line_item)
	}

	const params = validate_line_item_param(querystring_to_object(location.search))

	const current_line_item_index = params.line_item_number || 0

	assert(current_line_item_index < line_item_ids.length)

	const line_item_id = line_item_ids[current_line_item_index]

	let line_item = get_line_item(line_item_id)

	$: set_line_item(line_item)
</script>

<LineItemComponent bind:line_item />
