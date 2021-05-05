import { IName, IStarName } from "./name.interface";

export interface ISettingsGroup extends Required<IStarName> { }

export interface ISettingsCategory extends Required<IName> {
    tags: string[]
}

export interface ISettingsStaticCategory extends Required<IName> {
    template: string
}

export interface ISettingsRelationship extends Required<IName> {
    level: number
    order: number
}

export interface ISettings {
    groups?: ISettingsGroup[]
    categories?: ISettingsCategory[]
    relationships?: ISettingsRelationship[]
    staticCategories?: ISettingsStaticCategory[]
}