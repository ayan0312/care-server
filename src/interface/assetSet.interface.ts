import { IStarName } from './name.interface'
import { ISearch } from './search.interface'

export interface IAssetSet extends IStarName {
    intro?: string
    assetIds?: string
    characterId?: number
}

export interface IAssetSetSearchCondition extends IStarName {
    intro?: string
    assetIds?: string
    characterId?: string
}

export interface IAssetSetSearch extends ISearch<IAssetSetSearchCondition> {}
