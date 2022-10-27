import { Column, Entity } from 'typeorm'
import { NameEntity } from 'src/shared/name/name.entity'

export const enum SettingLevel {
    One = 1,
    Two,
    Three,
}

@Entity('story_setting')
export class StorySettingEntity extends NameEntity {
    @Column({ default: SettingLevel.One })
    public level: SettingLevel = SettingLevel.One

    @Column({ default: '' })
    public content: string = ''

    @Column()
    public storyId: number

    @Column({ default: false })
    public recycle: boolean = false

    @Column()
    public parentId: number = -1 // don't update but delete

    @Column({ default: '' })
    public assetIds: string = ''

    @Column({ default: '' })
    public characterIds: string = ''
}
