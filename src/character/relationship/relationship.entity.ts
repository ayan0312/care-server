import { Column, Entity } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'

export const enum RelationshipType {
    parent = 1,
    brother,
}

/**
 * {
 *  name:'父',
 *  targetType:1,
 *  gapNames:['祖父','曾祖父']
 *  targetName:'子'
 * }
 *
 * {
 *  name:'哥哥',
 *  targetType:2,
 *  targetName:'弟弟'
 * }
 *
 * {
 *  name:'血仇',
 *  targetType:2,
 *  targetName:'血仇'
 * }
 */
@Entity('relationship')
export class RelationshipEntity extends NameEntity {
    @Column('int')
    public order: number

    @Column('simple-array')
    public gapNames: string[]

    @Column('simple-enum')
    public targetType: RelationshipType

    @Column()
    public targetName: string
}

@Entity('character_relationship')
export class CharacterRelationshipEntity {
    @Column()
    public from: any

    @Column()
    public relationship: any

    @Column()
    public gap: number = 0

    @Column()
    public to: any
}
