import { In, Repository } from 'typeorm'
import { v4 as uuidv4 } from 'uuid'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import {
    createQueryIds,
    forEachAsync,
    mergeObjectToEntity,
    parseIds,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { StoryChapterEntity } from './storyChapter.entity'
import {
    IStoryChapter,
    IStoryChapterSearch,
    IStoryChapterSearchCondition,
} from 'src/interface/storyChapter.interface'
import { StoryService } from 'src/story/story.service'
import { ModuleRef } from '@nestjs/core'

@Injectable()
export class StoryChapterService {
    constructor(
        @InjectRepository(StoryChapterEntity)
        private readonly chapterRepo: Repository<StoryChapterEntity>,
        private readonly moduleRef: ModuleRef
    ) {}

    private storyService: StoryService

    public onModuleInit() {
        this.storyService = this.moduleRef.get(StoryService, { strict: false })
    }

    public async findAll() {
        return await this.chapterRepo.find()
    }

    public async findByVolumeId(
        volumeId: number,
        history = false,
        recycle = false
    ) {
        return await this.chapterRepo.findBy({ volumeId, history, recycle })
    }

    public async findByStoryId(
        storyId: number,
        history = false,
        recycle = false
    ) {
        return await this.chapterRepo.findBy({ storyId, history, recycle })
    }

    public async findHistorys(historyUUID: string) {
        return await this.chapterRepo.findBy({ historyUUID })
    }

    public async findById(id: number) {
        const result = await this.chapterRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        await this._patchChapter(result)
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.chapterRepo.findBy({ id: In(ids) })
    }

    private async _patchChapter(chapter: StoryChapterEntity) {
        const story = await this.storyService.findById(chapter.storyId)
        Object.assign(chapter, { story })
    }

    public async search(body: IStoryChapterSearch) {
        const {
            condition = {},
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = this._createConditionQB(condition)
        if (orderBy != null)
            qb = qb.orderBy(`chapter.${orderBy.sort}`, orderBy.order)

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

    private _createConditionQB(condition: IStoryChapterSearchCondition) {
        let qb = this.chapterRepo.createQueryBuilder('chapter')

        if (condition.name != null)
            qb = qb.where('chapter.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.content != null)
            qb = qb.andWhere('chapter.content like :content', {
                content: `%${condition.content}%`,
            })
        if (condition.star != null)
            qb = qb.andWhere('chapter.star = :star', {
                star: !!condition.star,
            })
        if (condition.rating != null)
            qb = qb.andWhere('chapter.rating = :rating', {
                rating: condition.rating,
            })
        if (condition.storyId != null)
            qb = qb.andWhere('chapter.storyId = :storyId', {
                storyId: condition.storyId,
            })
        if (condition.volumeId != null)
            qb = qb.andWhere('chapter.volumeId = :volumeId', {
                volumeId: condition.volumeId,
            })
        if (condition.recycle != null)
            qb = qb.andWhere('chapter.recycle = :recycle', {
                recycle: !!condition.recycle,
            })
        if (condition.history != null)
            qb = qb.andWhere('chapter.history = :history', {
                history: !!condition.history,
            })
        if (condition.historyUUID != null)
            qb = qb.andWhere('chapter.historyUUID = :historyUUID', {
                historyUUID: condition.historyUUID,
            })
        if (condition.assetIds)
            qb = queryQBIds(qb, condition.assetIds, 'chapter.assetIds')
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'chapter.characterIds')

        return qb
    }

    private async _mergeObjectToEntity(
        target: StoryChapterEntity,
        body: IStoryChapter
    ) {
        mergeObjectToEntity(target, body, [
            'historyUUID',
            'assetIds',
            'characterIds',
        ])
        if (body.assetIds != null)
            target.assetIds = createQueryIds(parseIds(body.assetIds))
        if (body.characterIds != null)
            target.characterIds = createQueryIds(parseIds(body.characterIds))
        await throwValidatedErrors(target)
    }

    public async copy(id: number, body: IStoryChapter) {
        const chapter = await this.findById(id)
        return await this.create({
            name: chapter.name,
            storyId: body.storyId,
            content: chapter.content,
            assetIds: chapter.assetIds,
            volumeId: body.volumeId,
            characterIds: chapter.characterIds,
        })
    }

    public async create(body: IStoryChapter) {
        const chapter = new StoryChapterEntity()

        if (body.historyUUID != null) {
            const historys = await this.findHistorys(body.historyUUID)
            await forEachAsync(historys, async (history) => {
                if (!history.history)
                    await this.update(history.id, { history: true })
            })
            chapter.historyUUID = body.historyUUID
        } else {
            chapter.historyUUID = uuidv4()
        }

        await this._mergeObjectToEntity(chapter, body)
        return this.chapterRepo.save(chapter)
    }

    public async update(id: number, body: Omit<IStoryChapter, 'historyUUID'>) {
        const chapter = await this.findById(id)
        await this._mergeObjectToEntity(chapter, body)
        return await this.chapterRepo.save(chapter)
    }

    public async delete(id: number) {
        const chapter = await this.findById(id)
        if (!chapter.recycle) return await this.update(id, { recycle: true })
        const historys = await this.findHistorys(chapter.historyUUID)
        return await this.chapterRepo.delete(
            historys.map((history) => history.id)
        )
    }

    public async hasName(name: string) {
        const chapter = await this.chapterRepo.findOneBy({ name })
        return !!chapter
    }
}