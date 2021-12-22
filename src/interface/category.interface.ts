import { IName } from './name.interface'

export const enum CategoryType {
    common = 0,
    asset,
    character,
}

export interface ICategory extends IName {
    type?: CategoryType
}

export interface ICategoryResult extends Required<ICategory> {}
