import { HttpException, HttpStatus } from '@nestjs/common'
import { validate, ValidatorOptions } from 'class-validator'
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm'

let id = 0
export function generateLocalId() {
    return `${Date.now()}_${++id}`
}

export const delUndefKey = <T extends Record<string, any>>(obj: T): T => {
    for (let key in obj) if (obj[key] == null) delete obj[key]
    return obj
}

export const mergeObjectToEntity = <
    T extends Record<string, any>,
    K extends object
>(
    entity: K,
    source: T,
    excludes: (keyof T)[] = []
) => {
    Object.keys(source).forEach((key) => {
        if (excludes.includes(key)) return
        if (key === 'id') return
        const value = source[key]
        ;(entity as any)[key] = value
    })
}

export const toTypeString = (value: unknown): string =>
    Object.prototype.toString.call(value)
export const isPlainObject = (val: unknown): val is object =>
    toTypeString(val) === '[object Object]'

export const isNumber = (val: unknown): val is number =>
    typeof val === 'number' && !isNaN(val)

export const parseIds = (ids: string) => {
    const results: number[] = []
    ids.split(',').forEach((id) => {
        if (id) results.push(Number(id))
    })
    return results
}

export async function throwValidatedErrors(
    object: object,
    validatorOptions?: ValidatorOptions
) {
    const errors = await validate(object, validatorOptions)

    if (errors.length > 0)
        throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)
}

export function patchQBIds<Entity extends ObjectLiteral>(
    qb: SelectQueryBuilder<Entity>,
    ids: string,
    property: string,
    alias: string,
    idKeyName: string = 'id'
) {
    qb = qb.leftJoin(property, alias)

    if (ids === 'false') qb = qb.andWhere(`${alias}.${idKeyName} IS NULL`)
    else if (ids !== '')
        qb = qb.andWhere(`${alias}.${idKeyName} IN (:...${alias}Ids)`, {
            [alias + 'Ids']: ids.split(','),
        })

    return qb
}

export function queryQBIds<Entity extends ObjectLiteral>(
    qb: SelectQueryBuilder<Entity>,
    ids: string,
    property: string,
    reverse = false
) {
    if (ids === 'false') qb = qb.andWhere(`${property} IS NULL`)
    else if (ids === 'empty') qb = qb.andWhere(`${property} LIKE ''`)
    else if (ids !== '') {
        let query = ''
        ids.split(',').forEach((id, i, arr) => {
            if (arr.length !== i + 1)
                query += `'%,${id},%' AND ${property}${
                    reverse ? ' NOT' : ''
                } LIKE`
            else query += `'%,${id},%'`
        })

        qb = qb.andWhere(`${property}${reverse ? ' NOT' : ''} LIKE ${query}`)
    }
    return qb
}

export function queryQBIdsForIdMap<Entity extends ObjectLiteral>(
    qb: SelectQueryBuilder<Entity>,
    ids: string,
    property: string
) {
    if (ids === 'false') qb = qb.andWhere(`${property} IS NULL`)
    else if (ids !== '') {
        let query = ''
        ids.split(',').forEach((id, i, arr) => {
            if (arr.length !== i + 1)
                query += `'%"${id}":%' AND ${property} LIKE`
            else query += `'%"${id}":%'`
        })

        qb = qb.andWhere(`${property} LIKE ${query}`)
    }
    return qb
}

export function createQueryIds(ids: number[]) {
    if (ids.length === 0) return ''
    return `,${ids.join()},`
}

export async function forEachAsync<T>(
    arr: T[],
    aCB: (value: T, index: number, curArr: T[]) => Promise<void>
) {
    for (let i = 0; i < arr.length; i++) await aCB(arr[i], i, arr)
}

export function formatDate(formatString: string, date: Date | number) {
    if (typeof date === 'number') date = new Date(date)

    let fmt = formatString
    const o = {
        'y+': date.getFullYear(),
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours() % 12 === 0 ? 12 : date.getHours() % 12,
        'H+': date.getHours(),
        'm+':
            date.getMinutes() < 10
                ? `0${date.getMinutes()}`
                : date.getMinutes(),
        's+':
            date.getSeconds() < 10
                ? `0${date.getSeconds()}`
                : date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        S: date.getMilliseconds(),
    }
    for (const k in o) {
        if (new RegExp(`(${k})`).test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length === 1
                    ? (o as any)[k]
                    : `00${(o as any)[k]}`.substr(`${(o as any)[k]}`.length)
            )
        }
    }
    return fmt
}
