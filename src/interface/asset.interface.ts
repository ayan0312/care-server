import { IStarName } from 'src/interface/name.interface'
import { ISearch } from 'src/interface/search.interface'

export const enum AssetType {
    file = 0,
    files = 1,
    folder = 2,
}

export interface IAsset extends IStarName {
    root?: string
    intro?: string
    folder?: string
    rename?: boolean
    tagIds?: string
    recycle?: boolean
    template?: boolean
    assetType?: AssetType
    filenames?: string[]
    characterIds?: string
}

export interface IAssetSearchCondition extends IStarName {
    name?: string
    intro?: string
    tagIds?: string
    random?: boolean
    reverse?: Record<string, boolean>
    recycle?: boolean
    relation?: boolean
    template?: boolean
    assetType?: AssetType
    characterIds?: string
}

export interface IAssetSearch extends ISearch<IAssetSearchCondition> {}
