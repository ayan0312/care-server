import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { mergeObjectToEntity, throwValidatedErrors } from 'src/shared/utilities'
import { StorySettingEntity } from './storySetting.entity'
import { IStorySetting } from 'src/interface/storySetting.interface'

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
