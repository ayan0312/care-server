import { Column, Entity, ManyToOne } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { CategoryEntity } from 'src/category/category.entity'
import { Length } from 'class-validator'

@Entity('tag')
export class TagEntity extends NameEntity {
    @ManyToOne((type) => CategoryEntity, (category) => category.tags)
    public category: CategoryEntity

    @Column({ type: 'int', default: 1 })
    public order: number

    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: '' })
    @Length(0, 100)
    public color: string = ''

    @Column({ default: false })
    public pinned: boolean = false
}
