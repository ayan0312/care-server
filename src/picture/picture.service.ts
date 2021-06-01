import gm from 'gm'
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
    IPictureSearchCondition,
} from 'src/interface/picture/picture.interface'
import { config } from 'src/shared/config'
import { patchURL, saveImage } from 'src/shared/image'
import { mergeObjectToEntity, parseIds } from 'src/shared/utilities'
import { Repository, SelectQueryBuilder } from 'typeorm'
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
    ) { }

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

    private async _createConditionQB(condition: IPictureSearchCondition) {
        let qb = this.picRepo
            .createQueryBuilder('picture')
            .where('picture.name like :name', { name: `%${condition.name ? condition.name : ''}%` })

        if (condition.tagIds != null)
            qb = qb
                .leftJoin('picture.tags', 'tag')
                .andWhere('tag.id IN (:...tagIds)', { tagIds: condition.tagIds.split(',') })
        if (condition.groupIds != null)
            qb = qb
                .leftJoin('picture.groups', 'group')
                .andWhere('group.id IN (:...groupIds)',
                    { groupIds: condition.groupIds.split(',') })
        if (condition.characterIds != null)
            qb = qb
                .leftJoin('picture.characters', 'character')
                .andWhere(
                    'character.id IN (:...characterIds)',
                    { characterIds: condition.characterIds.split(',') }
                )
        if (condition.star != null)
            qb = qb.andWhere('picture.star = :star', { star: !!condition.star })
        if (condition.intro != null)
            qb = qb.andWhere('picture.intro like :intro', { intro: `%${condition.intro}%` })
        if (condition.remark != null)
            qb = qb.andWhere('picture.remark like :remark', { remark: `%${condition.remark}%` })
        if (condition.rating != null)
            qb = qb.andWhere('picture.rating = :rating', { rating: condition.rating })

        return qb
    }

    public async search(body: IPictureSearch) {
        const { condition = { name: '' }, orderBy = { sort: 'created', order: 'DESC' }, size = 20, page = 1 } = body

        let qb = await this._createConditionQB(condition)

        if (orderBy != null)
            qb = qb
                .orderBy(`picture.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        return {
            page: Number(page),
            size: Number(size),
            rows: data[0].map((entity) => {
                patchURL(entity, ['pictures'])
                return Object.assign({}, entity, {
                    ['xsmall']: {
                        avatar: entity.picture.replace('pictures', 'pictures/300'),
                    }
                })
            }),
            total: data[1],
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
            return metadata
        } catch (err) {
            console.log(err)
            return null
        }
    }

    private async _savePicture(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'pictures',
            tempFilename
        )

        if (metadata === null)
            return '/pictures/package.png'

        gm(metadata.filename)
            .resize(300)
            .write(`${metadata.path}/300/${metadata.name}`, (err) => {
                if (err)
                    console.error(err)
            })

        return '/pictures/' + metadata.name
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
            target.picture = await this._savePicture(body.picture)
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
        const pic = await this.findById(id)
        return await this.picRepo.remove(pic)
    }
}
