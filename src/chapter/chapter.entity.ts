import { Column, Entity } from 'typeorm'
import { StarNameEntity } from 'src/shared/name/starName.entity'
import { Length } from 'class-validator'

@Entity('chapter')
export class ChapterEntity extends StarNameEntity {
    @Column({ default: '' })
    @Length(0, 1024)
    public remark: string = ''

    @Column()
    public storyId: number

    @Column()
    public volumeId: number

    @Column({ default: false })
    public recycle: boolean = false

    @Column({ default: '' })
    public content: string = '' // don't use IO of file system because the content size will not too big.

    @Column()
    public historyId: number // max 50

    @Column({ default: '' })
    public assetIds: string = '' // setting assets directly, it maybe unused

    @Column({ default: '' })
    public characterIds: string = '' // setting characters from the characters of story, it maybe unused
}
