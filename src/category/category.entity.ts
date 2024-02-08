import { Column, Entity, OneToMany } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { TagEntity } from 'src/tag/tag.entity'
import { CategoryType } from 'src/interface/category.interface'
import { Length } from 'class-validator'

@Entity('category')
export class CategoryEntity extends NameEntity {
    @OneToMany((type) => TagEntity, (tag) => tag.category)
    public tags: TagEntity[]

    @Column({ type: 'int', default: 1 })
    public order: number

    @Column({ type: 'int' })
    public type: CategoryType

    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: false })
    public pinned: boolean = false
}
