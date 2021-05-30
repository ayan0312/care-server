import { IStarName } from '../name.interface'

export interface IPicture extends IStarName {
    intro?: string
    avatar?: string
    remark?: string
    tagIds?: string
    picture: string
    groupIds?: string
    characterIds?: string
}

export interface IPictureSearch {
    name?: string
    page?: number
    size?: number
}
