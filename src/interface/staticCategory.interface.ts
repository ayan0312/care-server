import { IName } from './name.interface'

export interface IStaticCategory extends IName {
    intro?: string
    script?: string
    validateScript?: string
}

export interface IStaticCategoryResult extends Required<IStaticCategory> {}
