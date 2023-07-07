import { In, Repository } from 'typeorm'
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    forEachAsync,
    mergeObjectToEntity,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { StoryVolumeEntity } from './storyVolume.entity'
import { IStoryVolume } from 'src/interface/storyVolume.interface'
import { StoryChapterService } from 'src/storyChapter/storyChapter.service'
import { StoryChapterEntity } from 'src/storyChapter/storyChapter.entity'

@Injectable()
export class StoryVolumeService {
    constructor(
        @InjectRepository(StoryVolumeEntity)
        private readonly storyVolumeRepo: Repository<StoryVolumeEntity>,
        private readonly storyChapterService: StoryChapterService
    ) {}

    public async findByStoryId(storyId: number) {
        const volumes = await this.storyVolumeRepo.findBy({ storyId })
        const items: (StoryVolumeEntity & {
            chapters: StoryChapterEntity[]
        })[] = []
        await forEachAsync(volumes, async (volume) => {
            const chapters = await this.storyChapterService.findByVolumeId(
                volume.id
            )

            items.push(
                Object.assign({}, volume, {
                    chapters: chapters.map((chapter) => {
                        chapter.content = ''
                        return chapter
                    }),
                })
            )
        })
        return items
    }

    public async findAll() {
        return await this.storyVolumeRepo.find()
    }

    public async findById(id: number) {
        const result = await this.storyVolumeRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.storyVolumeRepo.findBy({
            id: In(ids),
        })
    }

    private async _mergeObjectToEntity(
        target: StoryVolumeEntity,
        body: IStoryVolume
    ) {
        mergeObjectToEntity(target, body)
        await throwValidatedErrors(target)
    }

    public async create(body: IStoryVolume) {
        const storyVolume = new StoryVolumeEntity()
        await this._mergeObjectToEntity(storyVolume, body)
        return this.storyVolumeRepo.save(storyVolume)
    }

    public async update(id: number, body: IStoryVolume) {
        const storyVolume = await this.findById(id)
        await this._mergeObjectToEntity(storyVolume, body)
        return await this.storyVolumeRepo.save(storyVolume)
    }

    public async delete(id: number, force = false) {
        const result = await this.findById(id)
        if (!force && !result.deletable)
            throw new BadRequestException(`${result.name} isn't deletable.`)
        const chapters = await this.storyChapterService.findByVolumeId(id)
        if (chapters.length > 0)
            throw new BadRequestException(
                'Please remove all chapters of the volume before deleting the volume.'
            )
        return await this.storyVolumeRepo.remove(result)
    }
}
