import { Column, Entity } from 'typeorm'

import { NameEntity } from 'src/shared/name/name.entity'

@Entity('diary')
export class DiaryEntity extends NameEntity {
    @Column({ default: false })
    public recycle: boolean = false

    @Column({ default: '' })
    public content: string = ''

    @Column({ default: '' })
    public characterIds: string = ''
}
