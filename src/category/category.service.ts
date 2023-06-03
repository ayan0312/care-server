import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CategoryType, ICategory } from 'src/interface/category.interface'
import { In, Repository } from 'typeorm'
import { TagEntity } from 'src/tag/tag.entity'
import { CategoryEntity } from './category.entity'
import { throwValidatedErrors } from 'src/shared/utilities'

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(CategoryEntity)
        private readonly categoryRepo: Repository<CategoryEntity>
    ) {}

    public async find(opts: { name?: string; type: CategoryType }) {
        return await this.categoryRepo.findBy(opts)
    }

    public async findAll() {
        return await this.categoryRepo.find()
    }

    public async findById(id: number) {
        const result = await this.categoryRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        return result
    }

    public async findRelations(type?: CategoryType) {
        let qb = this.categoryRepo
            .createQueryBuilder('category')
            .leftJoinAndSelect('category.tags', 'tag')

        if (type != null)
            qb = qb.where('category.type IN (:...types)', {
                types:
                    type === CategoryType.common
                        ? [type]
                        : [type, CategoryType.common],
            })

        return await qb.getMany()
    }

    public async findRelationsByIds(ids: number[]) {
        return await this.categoryRepo.find({
            where: { id: In(ids) },
            relations: ['tags'],
        })
    }

    public async create(body: ICategory) {
        const category = new CategoryEntity()
        if (body.name == null)
            throw new BadRequestException('name and type cannot be empty')
        if (body.type == null)
            throw new BadRequestException('type and type cannot be empty')
        if (await this.hasName(body.name, body.type))
            throw new ConflictException('has the same name')
        category.name = body.name
        category.type = body.type
        if (body.intro) category.intro = body.intro
        await throwValidatedErrors(category)

        return await this.categoryRepo.save(category)
    }

    public async update(id: number, body: ICategory) {
        const category = await this.findById(id)
        if (body.name) {
            if (await this.hasName(body.name, category.type))
                throw new ConflictException('has the same name')
            category.name = body.name
        }
        if (body.intro) category.intro = body.intro
        await throwValidatedErrors(category)

        return await this.categoryRepo.save(category)
    }

    public async delete(id: number) {
        const category = await this.findById(id)
        const result = await this.categoryRepo
            .createQueryBuilder()
            .relation('tags')
            .of(category)
            .loadOne<TagEntity>()

        if (result) throw new UnprocessableEntityException()
        return await this.categoryRepo.remove(category)
    }

    public async hasName(name: string, type: CategoryType) {
        return !!(await this.categoryRepo
            .createQueryBuilder('category')
            .where('category.name = :name', { name })
            .andWhere('category.type IN (:...types)', {
                types:
                    type === CategoryType.common
                        ? [type]
                        : [type, CategoryType.common],
            })
            .getOne())
    }
}
