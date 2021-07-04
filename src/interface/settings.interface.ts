import { IName } from './name.interface'
import { CategoryType } from './category.interface'

export interface ISettingsCategory extends Required<IName> {
    tags: string[]
    type: CategoryType
}

export interface ISettingsStaticCategory extends Required<IName> {
    template: string
}

export interface ISettingsRelationship extends Required<IName> {
    level: number
    order: number
}

export interface ISettings {
    categories?: ISettingsCategory[]
    relationships?: ISettingsRelationship[]
    staticCategories?: ISettingsStaticCategory[]
}
