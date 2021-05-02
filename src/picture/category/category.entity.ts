import { Entity, OneToMany } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { PictureTagEntity } from 'src/picture/tag/tag.entity'

@Entity('picture_category')
export class PictureCategoryEntity extends NameEntity {
    @OneToMany((type) => PictureTagEntity, (tag) => tag.category)
    public tags: PictureTagEntity
}
