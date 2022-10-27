import { Column, Entity } from 'typeorm'
import { NameEntity } from 'src/shared/name/name.entity'
import { Length } from 'class-validator'

@Entity('chapterVolume')
export class ChapterVolumeEntity extends NameEntity {
    @Column()
    public order: number // number of order * 10000. using the last four digits when the repeated orders existing

    @Column({ default: '' })
    @Length(0, 512)
    public intro: string = ''

    @Column()
    public storyId: number
}
