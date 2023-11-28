const pad2 = (value: number | string) => value.toString().padStart(2, '0')
const pad3 = (value: number | string) => value.toString().padStart(3, '0')

export const utc_to_iso_date = (date: Date) =>
	`${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`

export const utc_to_iso_datetime = (date: Date) =>
	`${utc_to_iso_date(date)}T${pad2(date.getUTCHours())}:${pad2(date.getUTCMinutes())}:${
		pad2(date.getUTCSeconds())
	}.${pad3(date.getUTCMilliseconds())}Z`
