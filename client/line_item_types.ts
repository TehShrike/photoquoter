export type LineItem = {
	id: string
	picture_data_url: string | null
}

export const create_new_line_item = (): LineItem => ({
	id: crypto.randomUUID(),
	picture_data_url: null,
})
