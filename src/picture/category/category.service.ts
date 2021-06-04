import {
    ConflictException,
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import { Repository } from 'typeorm'
import { PictureTagEntity } from '../tag/tag.entity'

import { PictureCategoryEntity } from './category.entity'

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(PictureCategoryEntity)
        private readonly categoryRepo: Repository<PictureCategoryEntity>
    ) {}

    public async find(name: string) {
        return await this.categoryRepo.find({ name })
    }

    public async findAll() {
        return await this.categoryRepo.find()
    }

    public async findById(id: number) {
        const result = await this.categoryRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findRelations() {
        return await this.categoryRepo.find({
            relations: ['tags'],
        })
    }

    public async findRelationsByIds(ids: number[]) {
        return await this.categoryRepo.findByIds(ids, {
            relations: ['tags'],
        })
    }

    public async create(name: string) {
        const category = new PictureCategoryEntity()
        category.name = name

        const errors = await validate(category)

        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(name))
            throw new ConflictException('has the same name')

        await this.categoryRepo.save(category)
        return category
    }

    public async update(id: number, name: string) {
        await this.findById(id)
        if (await this.hasName(name))
            throw new ConflictException('has the same name')

        return await this.categoryRepo.update(id, { name })
    }

    public async delete(id: number) {
        const category = await this.findById(id)
        const result = await this.categoryRepo
            .createQueryBuilder()
            .relation('tags')
            .of(category)
            .loadOne<PictureTagEntity>()

        if (result)
            throw new UnprocessableEntityException()
        return await this.categoryRepo.remove(category)
    }

    public async hasName(name: string) {
        const category = await this.categoryRepo.findOne({ name })
        return !!category
    }
}
