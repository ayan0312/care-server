import { Column, Entity } from 'typeorm'
import { NameEntity } from 'src/shared/name/name.entity'

@Entity('relationship')
export class RelationshipEntity extends NameEntity {
    @Column({ default: '' })
    public selfName: string = ''

    @Column({ default: '' })
    public targetName: string = ''
}
