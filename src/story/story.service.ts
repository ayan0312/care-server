import { Repository } from 'typeorm'
import {
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    createQueryIds,
    forEachAsync,
    mergeObjectToEntity,
    parseIds,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { StoryEntity } from './story.entity'
import {
    IStory,
    IStorySearch,
    IStorySearchCondition,
} from 'src/interface/story.interface'
import { StoryVolumeService } from 'src/storyVolume/storyVolume.service'
import { StoryChapterService } from 'src/storyChapter/storyChapter.service'

@Injectable()
export class StoryService {
    constructor(
        @InjectRepository(StoryEntity)
        private readonly storyRepo: Repository<StoryEntity>,
        private readonly storyVolumeService: StoryVolumeService,
        private readonly storyChapterService: StoryChapterService
    ) {}
    public async findAll() {
        return await this.storyRepo.find()
    }

    public async findById(id: number) {
        const result = await this.storyRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        return result
    }

    public async updateStoryNewest(id: number) {
        const story = await this.findById(id)
        const chapters = await this.storyChapterService.findByStoryId(id)
        if (chapters.length == 0) {
            Object.assign(story.newest, {
                name: '无',
                part: '',
                words: 0,
                total: 0,
                updated: Date.now(),
            })
        } else {
            const last = chapters[chapters.length - 1]
            Object.assign(story.newest, {
                name: last.name,
                part: last.content.substring(0, 200),
                words: chapters.reduce((prev, cur) => {
                    return prev + cur.content.length
                }, 0),
                total: chapters.length,
                updated: last.updated,
            })
        }

        story.characterIds = createQueryIds([
            ...new Set(
                chapters
                    .map((chapter) => parseIds(chapter.characterIds))
                    .filter((ids) => ids)
                    .flat()
            ),
        ])

        return await this.storyRepo.save(story)
    }

    public async findByIds(ids: number[]) {
        return await this.storyRepo.findByIds(ids)
    }

    public async search(body: IStorySearch) {
        const {
            condition = {},
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = this._createConditionQB(condition)
        if (orderBy != null)
            qb = qb.orderBy(`story.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        const rows = data[0]

        return {
            page: Number(page),
            size: Number(size),
            rows,
            total: data[1],
        }
    }

    private _createConditionQB(condition: IStorySearchCondition) {
        let qb = this.storyRepo.createQueryBuilder('story')

        if (condition.name != null)
            qb = qb.where('story.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.intro != null)
            qb = qb.andWhere('story.intro like :intro', {
                intro: `%${condition.intro}%`,
            })
        if (condition.star != null)
            qb = qb.andWhere('story.star = :star', {
                star: !!condition.star,
            })
        if (condition.rating != null)
            qb = qb.andWhere('story.rating = :rating', {
                rating: condition.rating,
            })
        if (condition.recycle != null)
            qb = qb.andWhere('story.recycle = :recycle', {
                recycle: !!condition.recycle,
            })
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'story.characterIds')

        return qb
    }

    private async _mergeObjectToEntity(target: StoryEntity, body: IStory) {
        mergeObjectToEntity(target, body, ['characterIds'])
        if (body.characterIds != null)
            target.characterIds = createQueryIds(parseIds(body.characterIds))
        await throwValidatedErrors(target)
    }

    public async create(body: IStory) {
        const story = new StoryEntity()
        await this._mergeObjectToEntity(story, body)

        if (await this.hasName(story.name))
            throw new ConflictException('has the same name')

        const result = await this.storyRepo.save(story)

        await this.storyVolumeService.create({
            name: '作品相关',
            intro: '',
            storyId: result.id,
            deletable: false,
        })

        return result
    }

    public async update(id: number, body: IStory) {
        const story = await this.findById(id)

        if (
            body.name &&
            story.name !== body.name &&
            (await this.hasName(body.name))
        )
            throw new ConflictException('has the same name')

        await this._mergeObjectToEntity(story, body)
        return await this.storyRepo.save(story)
    }

    public async delete(id: number) {
        const story = await this.findById(id)
        if (!story.recycle) return await this.update(id, { recycle: true })
        const volumes = await this.storyVolumeService.findByStoryId(story.id)
        await forEachAsync(volumes, async (volume) => {
            await this.storyVolumeService.delete(volume.id, true)
        })
        return await this.storyRepo.delete(id)
    }

    public async hasName(name: string) {
        const story = await this.storyRepo.findOneBy({ name })
        return !!story
    }
}
