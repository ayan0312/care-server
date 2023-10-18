import { Column, Entity, ManyToOne } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { CategoryEntity } from 'src/category/category.entity'

@Entity('tag')
export class TagEntity extends NameEntity {
    @ManyToOne((type) => CategoryEntity, (category) => category.tags)
    public category: CategoryEntity

    @Column({ type: 'int', default: 1 })
    public order: number
}
