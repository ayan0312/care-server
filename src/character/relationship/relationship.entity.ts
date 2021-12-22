import { Column, Entity } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { CharacterEntity } from '../character.entity'
import { Max, Min } from 'class-validator'

@Entity('relationship')
export class RelationshipEntity extends NameEntity {
    @Column()
    @Max(99)
    @Min(-99)
    public order: number
}

@Entity('character_relationship')
export class CharacterRelationshipEntity {
    @Column()
    public from: CharacterEntity

    @Column()
    public FromRelationships: RelationshipEntity

    @Column()
    public ToRelationships: RelationshipEntity

    @Column()
    public to: CharacterEntity
}
