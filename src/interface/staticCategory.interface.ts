import { IName } from './name.interface'

export interface IStaticCategory extends IName {
    intro?: string
    script?: string
    pinned?: boolean
    sortScript?: string
    placeholder?: string
}

export interface IStaticCategoryResult extends Required<IStaticCategory> {}
