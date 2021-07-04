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
    IAsset,
    IAssetSearch,
    IAssetSearchCondition,
} from 'src/interface/asset/asset.interface'
import { config } from 'src/shared/config'
import { ImageMetadata, patchURL, saveImage } from 'src/shared/image'
import { formatDate, mergeObjectToEntity, parseIds } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { AssetEntity } from './asset.entity'
import { GroupService } from './group/group.service'
import { CharacterService } from 'src/character/character.service'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'

@Injectable()
export class AssetService {
    constructor(
        @InjectRepository(AssetEntity)
        private readonly picRepo: Repository<AssetEntity>,
        private readonly tagService: TagService,
        private readonly charService: CharacterService,
        private readonly groupService: GroupService
    ) {}

    private _nameId = 0
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

    private async _createConditionQB(condition: IAssetSearchCondition) {
        let qb = this.picRepo
            .createQueryBuilder('asset')
            .where('asset.name like :name', {
                name: `%${condition.name ? condition.name : ''}%`,
            })

        if (condition.tagIds != null)
            qb = qb
                .leftJoin('asset.tags', 'tag')
                .andWhere('tag.id IN (:...tagIds)', {
                    tagIds: condition.tagIds.split(','),
                })
        if (condition.groupIds != null)
            qb = qb
                .leftJoin('asset.groups', 'group')
                .andWhere('group.id IN (:...groupIds)', {
                    groupIds: condition.groupIds.split(','),
                })
        if (condition.characterIds != null)
            qb = qb
                .leftJoin('asset.characters', 'character')
                .andWhere('character.id IN (:...characterIds)', {
                    characterIds: condition.characterIds.split(','),
                })
        if (condition.star != null)
            qb = qb.andWhere('asset.star = :star', { star: !!condition.star })
        if (condition.intro != null)
            qb = qb.andWhere('asset.intro like :intro', {
                intro: `%${condition.intro}%`,
            })
        if (condition.remark != null)
            qb = qb.andWhere('asset.remark like :remark', {
                remark: `%${condition.remark}%`,
            })
        if (condition.rating != null)
            qb = qb.andWhere('asset.rating = :rating', {
                rating: condition.rating,
            })

        return qb
    }

    public async search(body: IAssetSearch) {
        const {
            condition = { name: '' },
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = await this._createConditionQB(condition)

        if (orderBy != null)
            qb = qb.orderBy(`asset.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        return {
            page: Number(page),
            size: Number(size),
            rows: data[0].map((entity) => {
                patchURL(entity, ['asset'])
                return Object.assign({}, entity, {
                    xsmall: {
                        asset: entity.asset.replace(
                            'assets',
                            'assets/300'
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

    private async _saveAsset300(metadata: ImageMetadata) {
        return new Promise((resolve, reject) => {
            gm(metadata.filename)
                .resize(300)
                .write(`${metadata.path}/300/${metadata.name}`, (err) => {
                    if (err) console.error(err)
                    resolve(undefined)
                })
        })
    }

    private async _saveAsset(tempFilename: string) {
        const metadata = await this._saveImage(
            config.STORAGE_PATH + 'assets',
            tempFilename
        )

        if (metadata === null) return '/assets/package.png'

        await this._saveAsset300(metadata)

        return '/assets/' + metadata.name
    }

    private async _mergeBodyToEntity(target: AssetEntity, body: IAsset) {
        mergeObjectToEntity(target, body, [
            'asset',
            'tagIds',
            'groupIds',
            'characterIds',
        ])
        if (body.tagIds)
            target.tagIds = (
                await this.tagService.matchTagIds(
                    parseIds(body.tagIds),
                    CategoryType.asset
                )
            ).join(',')
        if (body.groupIds)
            target.groups = await this.groupService.findByIds(
                parseIds(body.groupIds)
            )
        if (body.asset) target.asset = await this._saveAsset(body.asset)
        if (body.characterIds)
            target.characters = await this.charService.findByIds(
                parseIds(body.characterIds)
            )

        return target
    }

    public async create(body: IAsset) {
        if (!body.name)
            body.name = `${formatDate('y-M-d H:m:s', new Date())}-${this
                ._nameId++}`

        const pic = await this._mergeBodyToEntity(new AssetEntity(), body)

        const errors = await validate(pic)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        const newPic = await this.picRepo.save(pic)
        return await this.picRepo.findOne(newPic.id)
    }

    public async update(id: number, body: IAsset) {
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
