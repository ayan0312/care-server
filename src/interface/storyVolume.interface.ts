import { IName } from './name.interface'

export interface IStoryVolume extends IName {
    intro?: string
    storyId?: number
    chapters?: number[]
}
