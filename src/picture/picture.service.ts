import {
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { validate } from 'class-validator'
import {
    IPicture,
    IPictureSearch,
} from 'src/interface/picture/picture.interface'
import { config } from 'src/shared/config'
import { patchURL, saveImage } from 'src/shared/image'
import { mergeObjectToEntity, parseIds } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { PictureEntity } from './picture.entity'
import { GroupService } from './group/group.service'
import { TagService } from './tag/tag.service'
import { CharacterService } from 'src/character/character.service'

@Injectable()
export class PictureService {
    constructor(
        @InjectRepository(PictureEntity)
        private readonly picRepo: Repository<PictureEntity>,
        private readonly tagService: TagService,
        private readonly charService: CharacterService,
        private readonly groupService: GroupService
    ) {}

    private _imageId = 0

    public async findById(id: number, relations: string[] = []) {
        const result = await this.picRepo.findOne(
            id,
            relations
                ? {
                      relations,
                  }
                : {}
        )
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return this.picRepo.findByIds(ids)
    }

    public async search(body: IPictureSearch) {
        const { name = '', size = 20, page = 1 } = body

        const qb = await this.picRepo
            .createQueryBuilder('picture')
            .where('picture.name like :name', { name: '%' + name + '%' })
            .orderBy('created', 'DESC')
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        return {
            page: Number(page),
            size: Number(size),
            rows: qb[0].map((entity) => patchURL(entity, ['picture'])),
            total: qb[1],
        }
    }

    private async _saveImage(targetPath: string, filename: string) {
        try {
            const metadata = await saveImage(
                `${Date.now()}.${++this._imageId}`,
                targetPath,
                `${config.TEMP_PATH}/${filename}`,
                true
            )
            return metadata.name
        } catch (err) {
            console.log(err)
            return ''
        }
    }

    private async _mergeBodyToEntity(target: PictureEntity, body: IPicture) {
        mergeObjectToEntity(target, body, [
            'tagIds',
            'picture',
            'groupIds',
            'characterIds',
        ])
        if (body.tagIds)
            target.tags = await this.tagService.findByIds(parseIds(body.tagIds))
        if (body.groupIds)
            target.groups = await this.groupService.findByIds(
                parseIds(body.groupIds)
            )
        if (body.picture)
            target.picture =
                '/pictures/' +
                (await this._saveImage(
                    config.STORAGE_PATH + 'pictures',
                    body.picture
                ))
        if (body.characterIds)
            target.characters = await this.charService.findByIds(
                parseIds(body.characterIds)
            )
        return target
    }

    public async create(body: IPicture) {
        const pic = await this._mergeBodyToEntity(new PictureEntity(), body)

        const errors = await validate(pic)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        const newPic = await this.picRepo.save(pic)
        return await this.picRepo.findOne(newPic.id)
    }

    public async update(id: number, body: IPicture) {
        const pic = await this.findById(id)
        await this._mergeBodyToEntity(pic, body)

        const errors = await validate(pic)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.picRepo.save(pic)
    }

    public async delete(id: number) {
        await this.findById(id)
        return await this.picRepo.delete(id)
    }
}
