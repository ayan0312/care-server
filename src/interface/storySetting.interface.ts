import { SettingLevel } from 'src/storySetting/storySetting.entity'
import { IName } from './name.interface'
import { ISearch } from './search.interface'

export interface IStorySetting extends IName {
    level?: SettingLevel
    content?: string
    storyId?: number
    recycle?: boolean
    parentId?: number
    assetIds?: string
    characterIds?: string
}

export interface IStorySettingSearchCondition extends IStorySetting {}

export interface IStorySettingSearch
    extends ISearch<IStorySettingSearchCondition> {}
