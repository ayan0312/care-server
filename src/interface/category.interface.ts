import { IName } from "./name.interface";

export const enum CategoryType {
    common = 0,
    character,
    picture,
}

export interface ICategory extends IName {
    type?: string
}