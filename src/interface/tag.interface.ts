import { ICategoryResult } from './category.interface'
import { IName } from './name.interface'

export interface ITag extends IName {
    categoryId?: number
}

export interface ITagResult extends Required<IName> {
    category?: ICategoryResult
}
