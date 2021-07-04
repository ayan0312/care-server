import { Column, Entity, OneToMany } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { TagEntity } from 'src/tag/tag.entity'
import { CategoryType } from 'src/interface/category.interface'

@Entity('category')
export class CategoryEntity extends NameEntity {
    @OneToMany((type) => TagEntity, (tag) => tag.category)
    public tags: TagEntity[]

    @Column({ type: 'int' })
    public type: CategoryType
}