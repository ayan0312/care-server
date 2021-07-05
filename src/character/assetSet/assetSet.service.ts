import { Repository } from 'typeorm'
import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import { IStarName } from 'src/interface/name.interface'
import { mergeObjectToEntity } from 'src/shared/utilities'
import { CharacterAssetSetEntity } from './assetSet.entity'

@Injectable()
export class AssetSetService {
    constructor(
        @InjectRepository(CharacterAssetSetEntity)
        private readonly assetSetRepo: Repository<CharacterAssetSetEntity>
    ) {}

    public async find(name: string) {
        return await this.assetSetRepo.find({ name })
    }

    public async findAll() {
        return await this.assetSetRepo.find()
    }

    public async findById(id: number) {
        const result = await this.assetSetRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.assetSetRepo.findByIds(ids)
    }

    public async create(body: IStarName) {
        const assetSet = new CharacterAssetSetEntity()
        mergeObjectToEntity(assetSet, body)

        const errors = await validate(assetSet)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(assetSet.name))
            throw new ConflictException('has the same name')

        return this.assetSetRepo.save(assetSet)
    }

    public async update(id: number, body: IStarName) {
        const assetSet = await this.findById(id)
        if (body.name)
            if (assetSet.name !== body.name && (await this.hasName(body.name)))
                throw new ConflictException('has the same name')

        mergeObjectToEntity(assetSet, body)

        const errors = await validate(assetSet)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.assetSetRepo.save(assetSet)
    }

    public async delete(id: number) {
        const assetSet = await this.findById(id)
        return await this.assetSetRepo.remove(assetSet)
    }

    public async hasName(name: string) {
        const assetSet = await this.assetSetRepo.findOne({ name })
        return !!assetSet
    }
}
