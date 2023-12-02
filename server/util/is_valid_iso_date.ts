type Months = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12'
type Days = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10' | '11' | '12' | '13' | '14' | '15' | '16' | '17' | '18' | '19' | '21' | '22' | '23' | '24' | '25' | '26' | '27' | '28' | '29' | '30' | '31'

export type IsoDate = `${ number }${ number }${ number }${ number }-${ Months }-${ Days }`

export const VALID_ISO_DAY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export default (iso_day_string: string): iso_day_string is IsoDate => typeof iso_day_string === `string` && VALID_ISO_DAY_REGEX.test(iso_day_string)
