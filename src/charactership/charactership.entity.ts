import { Column, Entity } from 'typeorm'
import { CommonEntity } from 'src/shared/common/common.entity'

@Entity('charactership')
export class CharactershipEntity extends CommonEntity {
    @Column()
    public relationshipId: number

    @Column()
    public selfId: number

    @Column()
    public selfName: string

    @Column()
    public targetId: number

    @Column()
    public targetName: string
}
