import { IStarName } from './name.interface'
import { ISearch } from './search.interface'

export interface IChapter extends IStarName {
    order?: number
    remark?: string
    storyId?: number
    content?: string
    recycle?: boolean
    assetIds?: string
    volumeId?: number
    historyId?: number
    characterIds?: string
}

export interface IChapterSearchCondition extends Omit<IChapter, 'order'> {}

export interface IChapterSearch extends ISearch<IChapterSearchCondition> {}
