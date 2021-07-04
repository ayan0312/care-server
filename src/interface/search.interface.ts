export interface ISearch<T extends Record<string, any>> {
    page?: number
    size?: number
    orderBy?: {
        sort: 'created' | 'updated'
        order: 'ASC' | 'DESC'
    }
    condition: T
}
