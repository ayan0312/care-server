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
    ICharacter,
    ICharacterSearch,
    ICharacterSearchCondition,
} from 'src/interface/character/character.interface'
import { config } from 'src/shared/config'
import { ImageMetadata, saveImage } from 'src/shared/image'
import { mergeObjectToEntity, parseIds } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { CharacterEntity } from 'src/character/character.entity'
import { CharacterGroupService } from 'src/character/group/group.service'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'
import { URL } from 'url'

@Injectable()
export class CharacterService {
    constructor(
        @InjectRepository(CharacterEntity)
        private readonly charRepo: Repository<CharacterEntity>,
        private readonly tagService: TagService,
        private readonly groupService: CharacterGroupService
    ) {}

    private _imageId = 0

    public async *generator(relations?: string[]) {
        let next = 0
        while (true) {
            next++
            let qb = this.charRepo.createQueryBuilder('character')

            if (relations)
                relations.forEach((relation) => {
                    qb = qb.leftJoinAndSelect(`character.${relation}`, relation)
                })

            const result = await qb
                .skip(1 * (next - 1))
                .take(1)
                .getManyAndCount()

            if (result[0].length === 0 || next > result[1]) break

            yield {
                data: result[0][0],
                count: result[1],
            }
        }
    }

    public async findById(id: number, relations: string[] = []) {
        const result = await this.charRepo.findOne(
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
        return this.charRepo.findByIds(ids)
    }

    public async findCategoryRelationsById(id: number) {
        const char = await this.findById(id, ['tags'])
        return await this.tagService.tranformCategoryRelationByIds(
            char.tags.map((tag) => tag.id)
        )
    }

    private _createConditionQB(condition: ICharacterSearchCondition) {
        let qb = this.charRepo
            .createQueryBuilder('character')
            .where('character.name like :name', {
                name: `%${condition.name ? condition.name : ''}%`,
            })

        if (condition.tagIds != null)
            qb = qb
                .leftJoin('character.tags', 'tag')
                .andWhere('tag.id IN (:...tagIds)', {
                    tagIds: condition.tagIds.split(','),
                })
        if (condition.groupIds != null)
            qb = qb
                .leftJoin('character.groups', 'group')
                .andWhere('group.id IN (:...groupIds)', {
                    groupIds: condition.groupIds.split(','),
                })
        if (condition.star != null)
            qb = qb.andWhere('character.star = :star', {
                star: !!condition.star,
            })
        if (condition.intro != null)
            qb = qb.andWhere('character.intro like :intro', {
                intro: `%${condition.intro}%`,
            })
        if (condition.remark != null)
            qb = qb.andWhere('character.remark like :remark', {
                remark: `%${condition.remark}%`,
            })
        if (condition.rating != null)
            qb = qb.andWhere('character.rating = :rating', {
                rating: condition.rating,
            })

        return qb
    }

    public async search(body: ICharacterSearch) {
        const {
            condition = { name: '' },
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = this._createConditionQB(condition)
        if (orderBy != null)
            qb = qb.orderBy(`character.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        return {
            page: Number(page),
            size: Number(size),
            rows: data[0].map((entity) => {
                return Object.assign({}, entity, {
                    avatar: new URL(entity.avatar, config.URL.AVATARS_PATH),
                    fullLengthPicture: new URL(
                        entity.fullLengthPicture,
                        config.URL.FULL_LENGTH_PICTURES_PATH
                    ),
                    ['xsmall']: {
                        avatar: new URL(
                            entity.avatar,
                            config.URL.AVATARS_200_PATH
                        ),
                        fullLengthPicture: new URL(
                            entity.fullLengthPicture,
                            config.URL.FULL_LENGTH_PICTURES_300_PATH
                        ),
                    },
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

    private async _saveAvatar200(metadata: ImageMetadata) {
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(200, 200, '!')
                .write(`${metadata.path}/200/${metadata.name}`, (err) => {
                    if (err) console.error(err)
                    resolve(undefined)
                })
        })
    }

    private async _saveAvatar(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'avatars',
            tempFilename
        )

        if (metadata === null) return '/avatars/package.png'

        await this._saveAvatar200(metadata)

        return metadata.name
    }

    private async _saveFullLengthPicture300(metadata: ImageMetadata) {
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(300)
                .write(`${metadata.path}/300/${metadata.name}`, (err) => {
                    if (err) console.error(err)
                    resolve(undefined)
                })
        })
    }

    private async _saveFullLengthPicture(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'fullLengthPictures',
            tempFilename
        )

        if (metadata === null) return '/fullLengthPictures/package.png'

        await this._saveFullLengthPicture300(metadata)

        return metadata.name
    }

    private async _mergeBodyToEntity(
        target: CharacterEntity,
        body: ICharacter
    ) {
        mergeObjectToEntity(target, body, [
            'tagIds',
            'avatar',
            'groupIds',
            'fullLengthPicture',
        ])
        if (body.tagIds)
            target.tags = await this.tagService.matchByIds(
                parseIds(body.tagIds),
                CategoryType.character
            )
        if (body.groupIds)
            target.groups = await this.groupService.findByIds(
                parseIds(body.groupIds)
            )
        if (body.avatar) target.avatar = await this._saveAvatar(body.avatar)
        if (body.fullLengthPicture)
            target.fullLengthPicture = await this._saveFullLengthPicture(
                body.fullLengthPicture
            )
        return target
    }

    public async create(body: ICharacter) {
        const char = await this._mergeBodyToEntity(new CharacterEntity(), body)

        const errors = await validate(char)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.charRepo.save(char)
    }

    public async update(id: number, body: ICharacter) {
        const char = await this.findById(id)
        await this._mergeBodyToEntity(char, body)

        const errors = await validate(char)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        await this.charRepo.save(char)
        return this.charRepo.findOne(id)
    }

    public async delete(id: number) {
        const char = await this.findById(id)
        return await this.charRepo.remove(char)
    }
}
