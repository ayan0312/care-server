import { Length } from 'class-validator'
import { Column, Entity } from 'typeorm'

import { CommonEntity } from 'src/shared/common/common.entity'

@Entity()
export abstract class NameEntity extends CommonEntity {
    @Column()
    @Length(1, 512)
    public name: string
}
