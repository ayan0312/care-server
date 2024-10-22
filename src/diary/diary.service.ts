import { In, Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { DiaryEntity } from './diary.entity'
import {
    createQueryIds,
    mergeObjectToEntity,
    parseIds,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import {
    IDiary,
    IDiarySearch,
    IDiarySearchCondition,
} from 'src/interface/diary.interface'

@Injectable()
export class DiaryService {
    constructor(
        @InjectRepository(DiaryEntity)
        private readonly diaryRepo: Repository<DiaryEntity>
    ) {}

    public async findAll() {
        return await this.diaryRepo.find()
    }

    public async findById(id: number) {
        const result = await this.diaryRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.diaryRepo.findBy({ id: In(ids) })
    }

    public async search(body: IDiarySearch) {
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

    private _createConditionQB(condition: IDiarySearchCondition) {
        let qb = this.diaryRepo.createQueryBuilder('chapter')

        if (condition.name != null)
            qb = qb.where('chapter.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.content != null)
            qb = qb.andWhere('chapter.content like :content', {
                content: `%${condition.content}%`,
            })
        if (condition.recycle != null)
            qb = qb.andWhere('chapter.recycle = :recycle', {
                recycle: !!condition.recycle,
            })
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'chapter.characterIds')

        return qb
    }

    private async _mergeObjectToEntity(target: DiaryEntity, body: IDiary) {
        mergeObjectToEntity(target, body, ['characterIds'])
        if (body.characterIds != null)
            target.characterIds = createQueryIds(parseIds(body.characterIds))
        await throwValidatedErrors(target)
    }

    public async create(body: IDiary) {
        const chapter = new DiaryEntity()

        await this._mergeObjectToEntity(chapter, body)
        return this.diaryRepo.save(chapter)
    }

    public async update(id: number, body: IDiary) {
        const chapter = await this.findById(id)
        await this._mergeObjectToEntity(chapter, body)
        return await this.diaryRepo.save(chapter)
    }

    public async delete(id: number) {
        const chapter = await this.findById(id)
        if (!chapter.recycle) return await this.update(id, { recycle: true })
        return await this.diaryRepo.delete(chapter.id)
    }

    public async hasName(name: string) {
        const chapter = await this.diaryRepo.findOneBy({ name })
        return !!chapter
    }
}
