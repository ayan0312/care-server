import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import {
    mergeObjectToEntity,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { StorySettingEntity } from './storySetting.entity'
import {
    IStorySetting,
    IStorySettingSearch,
    IStorySettingSearchCondition,
} from 'src/interface/storySetting.interface'

@Injectable()
export class StorySettingService {
    constructor(
        @InjectRepository(StorySettingEntity)
        private readonly storySettingRepo: Repository<StorySettingEntity>
    ) {}

    public async find(opts: Partial<IStorySetting>) {
        return await this.storySettingRepo.find(opts)
    }

    public async findById(id: number) {
        const result = await this.storySettingRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.storySettingRepo.findByIds(ids)
    }

    public async search(body: IStorySettingSearch) {
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

    private _createConditionQB(condition: IStorySettingSearchCondition) {
        let qb = this.storySettingRepo.createQueryBuilder('storySetting')

        if (condition.name != null)
            qb = qb.where('storySetting.name like :name', {
                name: `%${condition.name}%`,
            })
        if (condition.level != null)
            qb = qb.where('storySetting.level like :level', {
                level: condition.level,
            })
        if (condition.recycle != null)
            qb = qb.andWhere('storySetting.recycle = :recycle', {
                recycle: !!condition.recycle,
            })
        if (condition.content != null)
            qb = qb.where('storySetting.content like :content', {
                content: `%${condition.content}%`,
            })
        if (condition.storyId != null)
            qb = qb.andWhere('chapter.storyId = :storyId', {
                storyId: condition.storyId,
            })
        if (condition.parentId != null)
            qb = qb.andWhere('chapter.parentId = :parentId', {
                parentId: condition.parentId,
            })
        if (condition.assetIds)
            qb = queryQBIds(qb, condition.assetIds, 'storySetting.assetIds')
        if (condition.characterIds)
            qb = queryQBIds(
                qb,
                condition.characterIds,
                'storySetting.characterIds'
            )

        return qb
    }

    private async _mergeObjectToEntity(
        world: StorySettingEntity,
        body: IStorySetting
    ) {
        mergeObjectToEntity(world, body)
        await throwValidatedErrors(world)
    }

    public async create(body: IStorySetting) {
        const storySetting = new StorySettingEntity()
        await this._mergeObjectToEntity(storySetting, body)
        return this.storySettingRepo.save(storySetting)
    }

    public async update(id: number, body: IStorySetting) {
        const storySetting = await this.findById(id)
        await this._mergeObjectToEntity(storySetting, body)
        return await this.storySettingRepo.save(storySetting)
    }

    public async delete(id: number) {
        await this.findById(id)
        return await this.storySettingRepo.delete(id)
    }

    public async hasName(name: string) {
        const world = await this.storySettingRepo.findOne({ name })
        return !!world
    }
}
