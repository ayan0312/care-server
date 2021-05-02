import { IStarName } from "../name.interface";

export interface ICharacter extends IStarName {
    intro?: string
    avatar?: string
    remark?: string
    tagIds?: string
    groupIds?: string
    relationships?: string[]
    staicCategories?: string[]
    fullLengthPicture?: String
}

export interface ICharacterSearch {
    name?: string
    page?: number
    size?: number
}