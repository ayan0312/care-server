import { Column, Entity } from 'typeorm'
import { CommonEntity } from 'src/shared/common/common.entity'

@Entity('charactership')
export class CharactershipEntity extends CommonEntity {
    @Column()
    public relationshipId: number

    @Column()
    public selfId: number

    @Column()
    public targetId: number
}
