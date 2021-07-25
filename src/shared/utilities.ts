import { SelectQueryBuilder } from 'typeorm'

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
    return ids
        .split(',')
        .map((id) => Number(id))
        .filter((id) => isNumber(id))
}

export function patchQBIds<Entity>(
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

export function queryQBIds<Entity>(
    qb: SelectQueryBuilder<Entity>,
    ids: string,
    property: string,
    paramKey: string
) {
    if (ids === 'false') qb = qb.andWhere(`${property} IS NULL`)
    else if (ids !== '')
        qb = qb.andWhere(`${property} like :${paramKey}`, {
            [paramKey]: `%,${ids.split(',').join(',%,')},%`,
        })
    return qb
}

export function createQueryIds(ids: number[]) {
    if (ids.length === 0) return ''
    return `,${ids.join()},`
}

export function parseQueryIds(ids: string) {
    const results = ids.split(',')
    if (results.length > 3) {
        results.pop()
        results.shift()
        return results.map((id) => Number(id))
    }
    return []
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
