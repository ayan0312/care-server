import { Entity, ManyToMany, ManyToOne } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { PictureCategoryEntity } from 'src/picture/category/category.entity'
import { PictureEntity } from '../picture.entity'

@Entity('picture_tag')
export class PictureTagEntity extends NameEntity {
    @ManyToOne((type) => PictureCategoryEntity, (category) => category.tags)
    public category: PictureCategoryEntity

    @ManyToMany((type) => PictureEntity, (picture) => picture.tags)
    public pictures: PictureEntity[]
}
