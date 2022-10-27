import { Column, Entity } from 'typeorm'
import { NameEntity } from 'src/shared/name/name.entity'
import { Length } from 'class-validator'

@Entity('chapterVolume')
export class ChapterVolumeEntity extends NameEntity {
    @Column({ default: '' })
    @Length(0, 512)
    public intro: string = ''

    @Column()
    public storyId: number

    @Column('simple-array')
    public chapters: number[]
}
