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
import { CharacterGroupEntity } from './group.entity'

@Injectable()
export class GroupService {
    constructor(
        @InjectRepository(CharacterGroupEntity)
        private readonly groupRepo: Repository<CharacterGroupEntity>,
    ) { }

    public async find(name: string) {
        return await this.groupRepo.find({ name })
    }

    public async findAll() {
        return await this.groupRepo.find()
    }

    public async findById(id: number) {
        const result = await this.groupRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.groupRepo.findByIds(ids)
    }

    public async create(body: IStarName) {
        const group = new CharacterGroupEntity()
        mergeObjectToEntity(group, body)

        const errors = await validate(group)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(group.name))
            throw new ConflictException('has the same name')

        return this.groupRepo.insert(group)
    }

    public async update(id: number, body: IStarName) {
        const group = await this.findById(id)
        mergeObjectToEntity(group, body)

        const errors = await validate(group)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(group.name))
            throw new ConflictException('has the same name')

        return await this.groupRepo.save(group)
    }

    public async delete(id: number) {
        await this.findById(id)
        return await this.groupRepo.delete(id)
    }

    public async hasName(name: string) {
        const group = await this.groupRepo.findOne({ name })
        return !!group
    }
}
