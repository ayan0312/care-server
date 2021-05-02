import { Column, Entity } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'

@Entity('character_relationship')
export class RelationshipEntity extends NameEntity {
    @Column()
    public level: number

    @Column()
    public order: number
}
