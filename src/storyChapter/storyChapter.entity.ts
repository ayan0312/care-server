import { Column, Entity } from 'typeorm'
import { StarNameEntity } from 'src/shared/name/starName.entity'

@Entity('storyChapter')
export class StoryChapterEntity extends StarNameEntity {
    @Column()
    public storyId: number

    @Column()
    public volumeId: number

    @Column()
    public historyUUID: string // max 50

    @Column({ default: false })
    public history: boolean = false

    @Column({ default: false })
    public recycle: boolean = false

    @Column({ default: '' })
    public content: string = '' // don't use IO of file system because the content size will not too big.

    @Column({ default: '' })
    public assetIds: string = '' // setting assets directly, it maybe unused

    @Column({ default: '' })
    public characterIds: string = '' // setting characters directly, it maybe unused
}
