import { IStarName } from '../name.interface'
import { ISearch } from '../search.interface'

export interface ICharacterStaticCategory {
    [propname: number]: string
}

export interface ICharacter extends IStarName {
    intro?: string
    avatar?: string
    remark?: string
    tagIds?: string
    recycle?: boolean
    groupIds?: string
    assetSetIds?: string
    relationships?: string[]
    staticCategories?: ICharacterStaticCategory
    fullLengthPicture?: string
}

export interface ICharacterSearchCondition extends IStarName {
    intro?: string
    remark?: string
    tagIds?: string
    recycle?: boolean
    groupIds?: string
    assetSetIds?: string
    staticCategoryIds?: string
}

export interface ICharacterSearch extends ISearch<ICharacterSearchCondition> {}
