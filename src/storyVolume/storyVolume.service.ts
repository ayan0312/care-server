import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { mergeObjectToEntity, throwValidatedErrors } from 'src/shared/utilities'
import { StoryVolumeEntity } from './storyVolume.entity'
import { IStoryVolume } from 'src/interface/storyVolume.interface'

@Injectable()
export class StoryVolumeService {
    constructor(
        @InjectRepository(StoryVolumeEntity)
        private readonly storyVolumeRepo: Repository<StoryVolumeEntity>
    ) {}

    public async find(opts: IStoryVolume) {
        return await this.storyVolumeRepo.find(opts)
    }

    public async findAll() {
        return await this.storyVolumeRepo.find()
    }

    public async findById(id: number) {
        const result = await this.storyVolumeRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.storyVolumeRepo.findByIds(ids)
    }

    private async _mergeObjectToEntity(
        storyVolume: StoryVolumeEntity,
        body: IStoryVolume
    ) {
        mergeObjectToEntity(storyVolume, body)
        await throwValidatedErrors(storyVolume)
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

    public async delete(id: number) {
        await this.findById(id)
        return await this.storyVolumeRepo.delete(id)
    }

    public async hasName(name: string) {
        const storyVolume = await this.storyVolumeRepo.findOne({ name })
        return !!storyVolume
    }
}
