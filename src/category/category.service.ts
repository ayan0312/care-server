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
import { CategoryType } from 'src/interface/category.interface'
import { Repository } from 'typeorm'
import { TagEntity } from 'src/tag/tag.entity'
import { CategoryEntity } from './category.entity'

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepo: Repository<CategoryEntity>
    ) { }

    public async find(opts: { name?: string, type: CategoryType }) {
        return await this.categoryRepo.find(opts)
    }

    public async findById(id: number) {
        const result = await this.categoryRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findRelations(type: CategoryType) {
        return await this.categoryRepo
            .createQueryBuilder('category')
            .leftJoinAndSelect("category.tags", "tag")
            .where('category.type IN (:...types)', {
                types: type === CategoryType.common
                    ? [type]
                    : [type, CategoryType.common]
            })
            .getMany()
    }

    public async findRelationsByIds(ids: number[]) {
        return await this.categoryRepo.findByIds(ids, {
            relations: ['tags'],
        })
    }

    public async create(name: string, type: CategoryType) {
        const category = new CategoryEntity()
        category.name = name
        category.type = type

        const errors = await validate(category)

        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(name, type))
            throw new ConflictException('has the same name')
        return await this.categoryRepo.save(category)
    }

    public async rename(id: number, name: string) {
        const category = await this.findById(id)
        if (await this.hasName(name, category.type))
            throw new ConflictException('has the same name')

        return await this.categoryRepo.update(id, { name })
    }

    public async delete(id: number) {
        const category = await this.findById(id)
        const result = await this.categoryRepo
            .createQueryBuilder()
            .relation('tags')
            .of(category)
            .loadOne<TagEntity>()

        if (result)
            throw new UnprocessableEntityException()
        return await this.categoryRepo.remove(category)
    }

    public async hasName(name: string, type: CategoryType) {
        return !!await this.categoryRepo
            .createQueryBuilder('category')
            .where('category.name = :name', { name })
            .andWhere('category.type IN (:...types)', {
                types: type === CategoryType.common
                    ? [type]
                    : [type, CategoryType.common]
            })
            .getOne()
    }
}
