export type LineItem = {
	description: string
	invoice_line_item_anonymous_id: number
}

export type LineItemImage = {
	invoice_line_item_anonymous_image_id: number
	image: Blob
	mime_type: string
	invoice_line_item_anonymous_id: number
}

export type Image = {
	image: ArrayBuffer
	mime_type: string
}
