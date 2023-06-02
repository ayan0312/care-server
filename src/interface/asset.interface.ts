import { IStarName } from 'src/interface/name.interface'
import { ISearch } from 'src/interface/search.interface'

export const enum AssetType {
    file = 0,
    files = 1,
    folder = 2,
}

export interface IAsset extends IStarName {
    intro?: string
    remark?: string
    tagIds?: string
    recycle?: boolean
    groupIds?: string
    assetType?: AssetType
    filenames?: string[]
    assetSetIds?: string
    characterIds?: string
    folder?: string
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
    reverse?: Record<string, boolean>
}

export interface IAssetSearch extends ISearch<IAssetSearchCondition> {}
