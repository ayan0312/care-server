import { Column, Entity } from 'typeorm'

export interface Role {
    target: number | string | null
    comment?: string
}

export interface GenealogyTree {
    self: Role
    spouse: Role
    children: GenealogyTree[]
}

@Entity('character_genealogy')
export class CharacterGenealogy {
    @Column()
    public characterIds: string

    @Column('simple-json')
    public tree: GenealogyTree
}
