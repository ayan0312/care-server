import gm from 'gm'
import {
    BadRequestException,
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
import { ImageMetadata, saveImage } from 'src/shared/image'
import { formatDate, mergeObjectToEntity, parseIds } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { AssetEntity } from './asset.entity'
import { AssetGroupService } from './group/group.service'
import { CharacterService } from 'src/character/character.service'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'
import { URL } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { AssetSetService } from 'src/character/assetSet/assetSet.service'

@Injectable()
export class AssetService {
    constructor(
        @InjectRepository(AssetEntity)
        private readonly assetRepo: Repository<AssetEntity>,
        private readonly tagService: TagService,
        private readonly charService: CharacterService,
        private readonly groupService: AssetGroupService,
        private readonly assetSetService: AssetSetService
    ) {}

    private _nameId = 0

    public async findById(id: number, relations: string[] = []) {
        const result = await this.assetRepo.findOne(
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
        return this.assetRepo.findByIds(ids)
    }

    public async *generator(relations?: string[]) {
        let next = 0
        while (true) {
            next++
            let qb = this.assetRepo.createQueryBuilder('asset')

            if (relations)
                relations.forEach((relation) => {
                    qb = qb.leftJoinAndSelect(`asset.${relation}`, relation)
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

    private async _createConditionQB(condition: IAssetSearchCondition) {
        let qb = this.assetRepo
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
        if (condition.assetSetIds != null)
            if (condition.assetSetIds)
                qb = qb
                    .leftJoin('asset.assetSets', 'assetSet')
                    .andWhere('assetSet.id IN (:...assetSetIds)', {
                        assetSetIds: condition.assetSetIds.split(','),
                    })
            else
                qb = qb
                    .leftJoin('asset.assetSets', 'assetSet')
                    .andWhere('assetSet.id IS NULL')
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
                return Object.assign(entity, {
                    path: new URL(entity.path, config.URL.ASSETS_PATH),
                    xsmall: {
                        path: new URL(entity.path, config.URL.ASSETS_300_PATH),
                    },
                })
            }),
            total: data[1],
        }
    }

    private async _saveImage(targetPath: string, filename: string) {
        try {
            const metadata = await saveImage(
                uuidv4(),
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

        return metadata.name
    }

    private async _mergeBodyToEntity(target: AssetEntity, body: IAsset) {
        mergeObjectToEntity(target, body, [
            'path',
            'tagIds',
            'groupIds',
            'assetSetIds',
            'characterIds',
        ])

        if (body.path) target.path = await this._saveAsset(body.path)
        if (body.tagIds != null)
            target.tags = await this.tagService.matchByIds(
                parseIds(body.tagIds),
                CategoryType.asset
            )
        if (body.groupIds != null)
            target.groups = await this.groupService.findByIds(
                parseIds(body.groupIds)
            )
        if (body.assetSetIds != null)
            target.assetSets = await this.assetSetService.findByIds(
                parseIds(body.assetSetIds)
            )
        if (body.characterIds != null)
            target.characters = await this.charService.findByIds(
                parseIds(body.characterIds)
            )

        return target
    }

    public async create(body: IAsset) {
        if (!body.name)
            body.name = `${formatDate('y-M-d H:m:s', new Date())}-${this
                ._nameId++}`

        const asset = await this._mergeBodyToEntity(new AssetEntity(), body)

        const errors = await validate(asset)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        return await this.assetRepo.save(asset)
    }

    public async update(id: number, body: IAsset) {
        const asset = await this.findById(id)
        await this._mergeBodyToEntity(asset, body)

        const errors = await validate(asset)
        if (errors.length > 0)
            throw new HttpException({ errors }, HttpStatus.BAD_REQUEST)

        const newPic = await this.assetRepo.save(asset)
        return await this.assetRepo.findOne(newPic.id)
    }

    public async delete(id: number) {
        const asset = await this.findById(id)
        return await this.assetRepo.remove(asset)
    }
}
