import { IStarName } from './name.interface'
import { ISearch } from './search.interface'

export interface IStoryChapter extends IStarName {
    remark?: string
    storyId?: number
    content?: string
    recycle?: boolean
    history?: boolean
    assetIds?: string
    volumeId?: number
    historyUUID?: string
    characterIds?: string
}

export interface IStoryChapterSearchCondition extends IStoryChapter {}

export interface IStoryChapterSearch
    extends ISearch<IStoryChapterSearchCondition> {}
