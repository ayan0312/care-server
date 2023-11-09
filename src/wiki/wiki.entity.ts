import { Column, Entity } from 'typeorm'
import { CommonEntity } from 'src/shared/common/common.entity'

@Entity('wiki')
export class WikiEntity extends CommonEntity {
    @Column()
    public characterId: number

    @Column({ default: '' })
    public content: string = ''

    @Column({ default: false })
    public history: boolean = false

    @Column()
    public UUID: string
}
