import { Column, Entity } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'

@Entity('character_category_template')
export class CategoryTemplateEntity extends NameEntity {
    @Column()
    // @IsCategoryTemplateTemplate()
    public template: string
}
