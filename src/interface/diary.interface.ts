import { IName } from './name.interface'
import { ISearch } from './search.interface'

export interface IDiary extends IName {
    content?: string
    recycle?: boolean
    characterIds?: string
}

export interface IDiarySearchCondition extends IDiary {}

export interface IDiarySearch extends ISearch<IDiarySearchCondition> {}
