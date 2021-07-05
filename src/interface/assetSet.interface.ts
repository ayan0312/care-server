import { IStarName } from './name.interface'

export interface IAssetSet extends IStarName {
    assetIds?: string
    characterId?: number
}
