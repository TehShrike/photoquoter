export type InvoiceAnonymous = {
	invoice_anonymous_id: number
	uuid: string
}

export type InvoiceLineItemAnonymous = {
	invoice_line_item_anonymous_id: number
	description: string
	invoice_anonymous_id: number
}

export type InvoiceLineItemAnonymousImage = {
	invoice_line_item_anonymous_image_id: number
	image: Blob
	mime_type: string
	invoice_line_item_anonymous_id: number
}
