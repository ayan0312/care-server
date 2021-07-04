import { IStarName } from "../name.interface";

export interface PictureSet extends IStarName {
    characterId?: number
    pictureIds?: string
}