const tab_prefix_regex = /^\t*/
const get_tabs_at_start = (str: string) => {
	const match = tab_prefix_regex.exec(str)

	if (match) {
		const [tabs] = match

		return tabs.length
	}

	return 0
}

const white_space_to_trim = /^\n*|[\n\t]*$/g
export default (str: string): string => {
	str = str.replaceAll(white_space_to_trim, ``)
	const lines = str.split(`\n`)

	const least_number_of_leading_tabs = Math.min(
		...lines.filter((line) => line.length > 0).map(get_tabs_at_start),
	)

	return lines.map((line) => line.slice(least_number_of_leading_tabs)).join(`\n`)
}
