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
import { CharacterPictureSetEntity } from './pictureSet.entity'

@Injectable()
export class PictureSetService {
    constructor(
        @InjectRepository(CharacterPictureSetEntity)
        private readonly picSetRepo: Repository<CharacterPictureSetEntity>
    ) { }

    public async find(name: string) {
        return await this.picSetRepo.find({ name })
    }

    public async findAll() {
        return await this.picSetRepo.find()
    }

    public async findById(id: number) {
        const result = await this.picSetRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.picSetRepo.findByIds(ids)
    }

    public async create(body: IStarName) {
        const picSet = new CharacterPictureSetEntity()
        mergeObjectToEntity(picSet, body)

        const errors = await validate(picSet)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        if (await this.hasName(picSet.name))
            throw new ConflictException('has the same name')

        return this.picSetRepo.save(picSet)
    }

    public async update(id: number, body: IStarName) {
        const picSet = await this.findById(id)
        if (body.name)
            if (picSet.name !== body.name && (await this.hasName(body.name)))
                throw new ConflictException('has the same name')

        mergeObjectToEntity(picSet, body)

        const errors = await validate(picSet)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.picSetRepo.save(picSet)
    }

    public async delete(id: number) {
        const picSet = await this.findById(id)
        return await this.picSetRepo.remove(picSet)
    }

    public async hasName(name: string) {
        const picSet = await this.picSetRepo.findOne({ name })
        return !!picSet
    }
}
