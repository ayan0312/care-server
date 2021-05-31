import { IStarName } from '../name.interface'
import { ISearch } from '../search.interface';

export interface IPicture extends IStarName {
    intro?: string
    remark?: string
    tagIds?: string
    picture: string
    groupIds?: string
    characterIds?: string
}

export interface IPictureSearchCondition extends IStarName {
    name?: string
    intro?: string
    remark?: string
    tagIds?: string
    groupIds?: string
    characterIds?: string
}

export interface IPictureSearch extends ISearch<IPictureSearchCondition> { }

