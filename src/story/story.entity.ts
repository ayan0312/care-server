import { Column, Entity } from 'typeorm'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { Length } from 'class-validator'

export interface SimpleChapter {
    name: string
    part: string
    words: number
    total: number
    created: number
    updated: number
}

@Entity('story')
export class StoryEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1024)
    public intro: string = ''

    @Column({ default: false })
    public recycle: boolean = false

    @Column('simple-json')
    public newest: SimpleChapter = {
        name: '无',
        part: '',
        words: 0,
        total: 0,
        created: Date.now(),
        updated: Date.now(),
    }

    @Column({ default: '' })
    public characterIds: string = '' // being the same as the assetIds
}
