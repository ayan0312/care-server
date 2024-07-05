import { Column, Entity } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'
import { Length } from 'class-validator'
import { TokenTypes } from './token'

@Entity('static_category')
export class StaticCategoryEntity extends NameEntity {
    @Column({ default: 0 })
    public sort: number = 0

    @Column({ default: '' })
    @Length(0, 1000)
    public intro: string = ''

    @Column({ default: '' })
    public script: string = ''

    @Column({ default: false })
    public pinned: boolean = false

    @Column({ default: 'text' })
    public component: TokenTypes = 'text'

    @Column({ default: '' })
    public placeholder: string = ''
}
