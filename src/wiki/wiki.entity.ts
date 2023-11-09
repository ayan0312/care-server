import { Column, Entity } from 'typeorm'
import { CommonEntity } from 'src/shared/common/common.entity'

@Entity('wiki')
export class WikiEntity extends CommonEntity {
    @Column()
    public characterId: number

    @Column({ default: '' })
    public characterIds: string = ''

    @Column({ default: '' })
    public content: string = ''
}
