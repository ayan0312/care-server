import { Column, Entity } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { Length } from 'class-validator'

@Entity('static_category')
export class StaticCategoryEntity extends NameEntity {
    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: '' })
    public script: string = ''

    @Column({ default: '' })
    public validateScript: string = ''
}
