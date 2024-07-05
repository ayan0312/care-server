import _ from 'lodash'

type Token<T extends string, C extends boolean = false> = {
    type: T
    order: number
    comparable: C
}

export type TokenText = Token<'text'> & {
    raw: string
}

function newTokenText(raw: string): TokenText {
    return { type: 'text', raw, order: 0, comparable: false }
}

export type TokenMultipleText = Token<'multiple-text'> & {
    raw: string
    values: string[]
}

function newTokenMultipleText(
    raw: string,
    values: string[]
): TokenMultipleText {
    return { type: 'multiple-text', raw, values, order: 0, comparable: false }
}

export type TokenNumber = Token<'number', true> & {
    raw: string
    value: number
}

function newTokenNumber(raw: string, value: number): TokenNumber {
    return { type: 'number', raw, value, order: value, comparable: true }
}

type HeightUnit = 'cm' | 'm' | 'km'
export type TokenHeight = Token<'height', true> & {
    raw: string
    unit: HeightUnit
    height: number
}

function newTokenHeight(
    raw: string,
    unit: HeightUnit,
    height: number
): TokenHeight {
    return {
        type: 'height',
        raw,
        unit,
        height,
        order: height * (unit === 'cm' ? 1 : unit === 'm' ? 100 : 100000),
        comparable: true,
    }
}

type WeightUnit = 't' | 'kg'
export type TokenWeight = Token<'weight', true> & {
    raw: string
    unit: WeightUnit
    weight: number
}

function newTokenWeight(
    raw: string,
    unit: WeightUnit,
    weight: number
): TokenWeight {
    return {
        type: 'weight',
        raw,
        unit,
        weight,
        order: weight * (unit === 't' ? 1000 : 1),
        comparable: true,
    }
}

type CalendarSequence = { base: number; name: string; value: number }[]
export type TokenCalendar = Token<'calendar', true> & {
    raw: string
    system: string
    sequence: CalendarSequence
}

function newTokenCalendar(
    raw: string,
    system: string,
    sequence: CalendarSequence
): TokenCalendar {
    return {
        type: 'calendar',
        raw,
        system,
        sequence,
        order: sequence.reduce((acc, { base, value }) => acc + base * value, 0),
        comparable: true,
    }
}

export type Tokens =
    | TokenText
    | TokenMultipleText
    | TokenNumber
    | TokenHeight
    | TokenWeight
    | TokenCalendar
export type TokenTypes = Tokens['type']

export function tokenize<T extends TokenTypes>(type: T, raw: string) {
    return tokenizers[type](raw) as Extract<Tokens, { type: T }>
}

const tokenizers = {
    text(raw: string) {
        return newTokenText(raw)
    },
    'multiple-text'(raw: string) {
        const values = raw.split(',')
        return newTokenMultipleText(raw, values)
    },
    number(raw: string) {
        let plus = false
        let str = raw

        if (str.endsWith('+')) {
            str = str.slice(0, -1)
            plus = true
        }

        let order: number
        try {
            order = parseFloat(str)
        } catch (err) {
            throw new Error(`Invalid number: ${raw}`)
        }

        if (plus) {
            let maxNum = ''
            for (let i = 0; i < str.length; i++) {
                switch (str[i]) {
                    case '-':
                        maxNum += '-'
                        break
                    case '.':
                        maxNum += '.'
                        break
                    default:
                        if (i == 0 || (i == 1 && str[0] == '-')) {
                            maxNum += str[i]
                            break
                        }
                        maxNum += '9'
                        break
                }
            }
            try {
                order = parseFloat(maxNum)
            } catch (err) {
                throw new Error(`Invalid number: ${raw}`)
            }
        }
        if (_.isNaN(order)) throw new Error(`Invalid number: ${raw}`)
        if (!_.isFinite(order)) throw new Error(`Number is too large: ${raw}`)
        return newTokenNumber(raw, order)
    },
    height(raw: string) {
        const match = raw.match(/^(\d+)(cm|m|km)$/)
        if (!match) throw new Error(`Invalid height: ${raw}`)
        const height = _.toNumber(match[1])
        if (_.isNaN(height)) throw new Error(`Invalid height: ${raw}`)
        if (!_.isFinite(height)) throw new Error(`Height is too large: ${raw}`)
        return newTokenHeight(raw, match[2] as HeightUnit, height)
    },
    weight(raw: string) {
        const match = raw.match(/^(\d+)(t|kg)$/)
        if (!match) throw new Error(`Invalid weight: ${raw}`)
        const weight = _.toNumber(match[1])
        if (_.isNaN(weight)) throw new Error(`Invalid weight: ${raw}`)
        if (!_.isFinite(weight)) throw new Error(`Weight is too large: ${raw}`)
        return newTokenWeight(raw, match[2] as WeightUnit, weight)
    },
    calendar(raw: string) {
        const match = raw.match(/^([A-Z]{3})\s(\d+)$/)
        if (!match) throw new Error(`Invalid calendar: ${raw}`)
        const system = match[1]
        const sequence = _.chain(match[2])
            .split('')
            .map((char) => _.toNumber(char))
            .map((value, index, array) => ({
                base: Math.pow(10, array.length - index - 1),
                name: `digit${index + 1}`,
                value,
            }))
            .value()
        return newTokenCalendar(raw, system, sequence)
    },
}
