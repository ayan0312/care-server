import { IStarName } from './name.interface'
import { ISearch } from './search.interface'

export interface IStory extends IStarName {
    chapter: number
    worldId?: number
    content?: string
    assetIds?: string
    characterIds?: string
}

export interface IStorySearchCondition extends IStarName {
    worldId?: number
    content?: string
    assetIds?: string
    characterIds?: string
}

export interface IStorySearch extends ISearch<IStorySearchCondition> {}
