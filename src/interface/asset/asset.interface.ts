import { IStarName } from '../name.interface'
import { ISearch } from '../search.interface'

export interface IAsset extends IStarName {
    path: string
    intro?: string
    remark?: string
    tagIds?: string
    groupIds?: string
    characterIds?: string
}

export interface IAssetSearchCondition extends IStarName {
    name?: string
    intro?: string
    remark?: string
    tagIds?: string
    groupIds?: string
    characterIds?: string
}

export interface IAssetSearch extends ISearch<IAssetSearchCondition> {}
