<script lang=ts>
	import type {LineItem} from './line_item_types'
	import LineItemComponent from './LineItem.svelte'
	import { querystring_to_object } from './query_serialization'
	import param_validator from './param_validator';
	import jv from './json_validator'
	import assert from './assert'
	import make_validator_asserter from './make_validator_asserter';

	const cast_line_item_param = param_validator({
		line_item_number: param_validator.integer
	})

	const assert_line_item_ids_valid = make_validator_asserter(jv.array(jv.string))
	const assert_line_item_valid = make_validator_asserter(jv.object({
		picture_data_url: jv.nullable(jv.string)
	}))

	const params = cast_line_item_param(querystring_to_object(location.search))

	const line_item_ids = localStorage.getItem('line_item_ids') || []

	if (line_item_ids.length === 0) {
		throw new Error('IMPLEMENT THIS: create an empty line item')
		// and then forcibly redirect to line item index 0
	}

	assert_line_item_ids_valid(line_item_ids, 'line_item_ids')

	const current_line_item_index = params.line_item_number || 0

	assert(current_line_item_index < line_item_ids.length)

	const line_item_id = line_item_ids[current_line_item_index]

	const line_item = localStorage.getItem(`line_item-${line_item_id}`)

	assert_line_item_valid(line_item, `line_item (${line_item_id})`)

	/*
		state in localstorage: list of line item ids, and each line item
		probably only need the current line item index in the querystring
		then can lookup the line item id
		then can pull that line item's data from localstorage
		then feed that into the line item component

		if no state exists: create one with a single empty line item and redirect to the 0th line item
	*/
</script>

<LineItemComponent {line_item} />
