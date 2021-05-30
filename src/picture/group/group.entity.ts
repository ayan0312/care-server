import { Entity, JoinTable, ManyToMany, ManyToOne } from 'typeorm'

import { PictureEntity } from 'src/picture/picture.entity'
import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('picture_group')
export class PictureGroupEntity extends StarNameEntity {
    @ManyToMany((type) => PictureEntity, (picture) => picture.groups)
    @JoinTable()
    public pictures: PictureEntity[]
}
