import { ICategoryResult } from './category.interface'
import { IName } from './name.interface'

export interface ITag extends IName {
    order?: number
    color?: string
    pinned?: boolean
    categoryId?: number
}

export interface ITagResult extends Required<IName> {
    order: number
    color: string
    category?: ICategoryResult
}
