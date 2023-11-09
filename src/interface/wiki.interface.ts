import { IStarName } from './name.interface'

export interface IWiki extends IStarName {
    content?: string
    characterId?: number
}
