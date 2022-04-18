import { IStarName } from '../name.interface'
import { ISearch } from '../search.interface'

export interface ICharacter extends IStarName {
    intro?: string
    avatar?: string
    remark?: string
    tagIds?: string
    groupIds?: string
    assetSetIds?: string
    relationships?: string[]
    staicCategories?: { [propname: number]: string }
    fullLengthPicture?: string
}

export interface ICharacterSearchCondition extends IStarName {
    intro?: string
    remark?: string
    tagIds?: string
    groupIds?: string
    assetSetIds?: string
}

export interface ICharacterSearch extends ISearch<ICharacterSearchCondition> {}
