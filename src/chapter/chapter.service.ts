import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    mergeObjectToEntity,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { ChapterEntity } from './chapter.entity'
import {
    IChapter,
    IChapterSearch,
    IChapterSearchCondition,
} from 'src/interface/chapter.interface'

@Injectable()
export class ChapterService {
    constructor(
        @InjectRepository(ChapterEntity)
        private readonly chapterRepo: Repository<ChapterEntity>
    ) {}

    public async findAll() {
        return await this.chapterRepo.find()
    }

    public async findById(id: number) {
        const result = await this.chapterRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.chapterRepo.findByIds(ids)
    }

    public async search(body: IChapterSearch) {
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

    private _createConditionQB(condition: IChapterSearchCondition) {
        let qb = this.chapterRepo.createQueryBuilder('chapter')

        if (condition.name != null)
            qb = qb.where('chapter.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.remark != null)
            qb = qb.where('chapter.remark like :remark', {
                remark: `%${condition.remark}%`,
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
        if (condition.historyId != null)
            qb = qb.andWhere('chapter.historyId = :historyId', {
                historyId: condition.historyId,
            })
        if (condition.assetIds)
            qb = queryQBIds(qb, condition.assetIds, 'chapter.assetIds')
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'chapter.characterIds')

        return qb
    }

    private async _mergeObjectToEntity(chapter: ChapterEntity, body: IChapter) {
        mergeObjectToEntity(chapter, body)
        await throwValidatedErrors(chapter)
    }

    public async create(body: IChapter) {
        const chapter = new ChapterEntity()
        await this._mergeObjectToEntity(chapter, body)
        return this.chapterRepo.save(chapter)
    }

    public async update(id: number, body: IChapter) {
        const chapter = await this.findById(id)
        await this._mergeObjectToEntity(chapter, body)
        return await this.chapterRepo.save(chapter)
    }

    public async delete(id: number) {
        const chapter = await this.findById(id)
        if (!chapter.recycle) return await this.update(id, { recycle: true })
        return await this.chapterRepo.delete(id)
    }

    public async hasName(name: string) {
        const chapter = await this.chapterRepo.findOne({ name })
        return !!chapter
    }
}
