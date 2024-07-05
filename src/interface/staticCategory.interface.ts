import { IName } from './name.interface'

export interface IStaticCategory extends IName {
    sort?: number
    intro?: string
    script?: string
    pinned?: boolean
    component?: string
    placeholder?: string
}

export interface IStaticCategoryResult extends Required<IStaticCategory> {}
