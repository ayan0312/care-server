import { IName } from './name.interface'

export interface IRelationship extends IName {
    targetName?: string
    selfName?: string
}

export interface IRelationshipResult extends Required<IRelationship> {}
