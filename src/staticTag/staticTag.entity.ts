import { Column, Entity } from 'typeorm'
import { CommonEntity } from 'src/shared/common/common.entity'

@Entity('static_tag')
export class StaticTagEntity extends CommonEntity {
    @Column()
    public order: number

    @Column({ default: '' })
    public value: string

    @Column('simple-json')
    public parameters: Record<string, string> = {}

    @Column()
    public characterId: number

    @Column()
    public staticCategoryId: number
}
