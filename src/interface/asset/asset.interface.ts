import { IStarName } from 'src/interface/name.interface'
import { ISearch } from 'src/interface/search.interface'

export const enum AssetType {
    file = 1,
    files,
    folder,
}

export interface IAsset extends IStarName {
    path?: string
    intro?: string
    remark?: string
    tagIds?: string
    recycle?: boolean
    groupIds?: string
    assetType?: AssetType
    assetSetIds?: string
    characterIds?: string
}

export interface IAssetSearchCondition extends IStarName {
    name?: string
    intro?: string
    remark?: string
    tagIds?: string
    recycle?: boolean
    groupIds?: string
    assetType?: AssetType
    assetSetIds?: string
    characterIds?: string
}

export interface IAssetSearch extends ISearch<IAssetSearchCondition> {}
