import { EventEmitter } from 'events'

export type Second = number

export interface MapData<T> {
    expire: Second
    data: T
}

export class ExpireMap<R> extends EventEmitter {
    private _timerMap: Record<string, any> = {}
    private _map: Map<string, R> = new Map()
    private _expire: Second

    constructor(expire: Second = 180) {
        super()
        this._expire = expire
    }

    public push = (key: string, value: R, expire?: Second) => {
        this._set(key, value, expire)
    }

    public values = () => {
        return this._values()
    }

    public delete = (key: string) => {
        if (!this._map.has(key)) return
        const value = this._map.get(key)
        if (this._timerMap[key] != null) {
            clearTimeout(this._timerMap[key])
            delete this._timerMap[key]
        }
        this._map.delete(key)
        this.emit('delete', value)
    }

    private _values() {
        const values: R[] = []
        for (const value of this._map.values()) values.push(value)
        return values
    }

    private _set(key: string, value: R, expire?: Second) {
        if (this._map.has(key)) return
        if (this._timerMap[key] == null) {
            this._timerMap[key] = setTimeout(() => {
                this._map.delete(key)
                this.emit('delete', value)
                delete this._timerMap[key]
            }, (expire || this._expire) * 1000)
        }
        this._map.set(key, value)
        this.emit('set', value)
    }
}
