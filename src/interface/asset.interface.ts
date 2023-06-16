import { IStarName } from 'src/interface/name.interface'
import { ISearch } from 'src/interface/search.interface'

export const enum AssetType {
    file = 0,
    files = 1,
    folder = 2,
}

export interface IAsset extends IStarName {
    intro?: string
    tagIds?: string
    recycle?: boolean
    assetType?: AssetType
    filenames?: string[]
    characterIds?: string
    folder?: string
}

export interface IAssetSearchCondition extends IStarName {
    name?: string
    intro?: string
    tagIds?: string
    recycle?: boolean
    assetType?: AssetType
    characterIds?: string
    relation?: boolean
    reverse?: Record<string, boolean>
}

export interface IAssetSearch extends ISearch<IAssetSearchCondition> {}
