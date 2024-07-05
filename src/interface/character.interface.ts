import { IStarName } from './name.interface'
import { ISearch } from './search.interface'

export interface ICharacterStaticCategory {
    [propname: number]: string
}

export interface ICharacter extends IStarName {
    intro?: string
    avatar?: string
    tagIds?: string
    recycle?: boolean
    template?: boolean
    relationships?: string[]
    staticCategories?: ICharacterStaticCategory
    fullLengthPicture?: string
}

export interface ICharacterSearchCondition extends IStarName {
    intro?: string
    tagIds?: string
    recycle?: boolean
    template?: boolean
    staticCategories?: ISearchSCategory[]
    staticCategoryIds?: string
}

export interface ISearchSCategory {
    id: number
    value: string
    order: 'ASC' | 'DESC'
    method: '>' | '>=' | '<' | '<=' | '=' | 'like' | 'isNull' | 'isNotNull'
}

export interface ICharacterSearch extends ISearch<ICharacterSearchCondition> {}
