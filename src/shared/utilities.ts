export const delUndefKey = <T extends Record<string, any>>(obj: T): T => {
    for (let key in obj) if (obj[key] == null) delete obj[key]
    return obj
}

export const mergeObjectToEntity = <T extends Record<string, any>, K extends object>(entity: K, source: T, excludes: (keyof T)[] = []) => {
    Object.keys(source).forEach(key => {
        if (excludes.includes(key)) return
        const value = source[key]
            ; (entity as any)[key] = value
    })
}

export const isNumber = (val: unknown): val is number =>
    typeof val === 'number' && !isNaN(val)

export const parseIds = (ids: string) => {
    return ids.split(',').map(id => Number(id)).filter(id => isNumber(id))
}