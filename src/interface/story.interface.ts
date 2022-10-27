import { IStarName } from './name.interface'
import { ISearch } from './search.interface'

export interface IStory extends IStarName {
    intro?: string
    recycle?: boolean
    characterIds?: string
}

export interface IStorySearchCondition extends IStory {}

export interface IStorySearch extends ISearch<IStorySearchCondition> {}
