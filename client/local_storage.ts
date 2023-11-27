import jv from 'shared/json_validator'
import make_validator_asserter from './make_validator_asserter'

import type { LineItem } from './line_item_types'

const assert_line_item_ids_valid = make_validator_asserter(jv.array(jv.string))

export const get_line_item_ids = (): string[] => {
	const line_item_ids_string = localStorage.getItem('line_item_ids')

	if (!line_item_ids_string) {
		return []
	}

	const line_item_ids_array = JSON.parse(line_item_ids_string)

	assert_line_item_ids_valid(line_item_ids_array, 'line_item_ids_array')

	return line_item_ids_array
}

const assert_line_item_valid = make_validator_asserter(jv.object({
	id: jv.string,
	picture_data_url: jv.nullable(jv.string),
}))

const line_item_key = (id: string) => `line_item-${id}`

export const get_line_item = (id: string): LineItem => {
	const line_item_string = localStorage.getItem(line_item_key(id))

	const line_item = JSON.parse(line_item_string)

	assert_line_item_valid(line_item, `line_item (${id})`)

	return line_item
}

export const set_line_item_ids = (line_item_ids: string[]) => {
	localStorage.setItem('line_item_ids', JSON.stringify(line_item_ids))
}

export const set_line_item = (line_item: LineItem) => {
	localStorage.setItem(line_item_key(line_item.id), JSON.stringify(line_item))
}
