export interface ISearch<T extends Record<string, any>> {
    page?: number
    size?: number
    orderBy?: {
        sort: string
        order: 'ASC' | 'DESC'
    }
    condition: T
}
