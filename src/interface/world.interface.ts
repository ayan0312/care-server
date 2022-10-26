import { IStarName } from './name.interface'
import { ISearch } from './search.interface'

export interface IWorld extends IStarName {
    content?: string
    assetIds?: string
    characterIds?: string
}

export interface IWorldSearchCondition extends IWorld {}

export interface IWorldSearch extends ISearch<IWorldSearchCondition> {}
