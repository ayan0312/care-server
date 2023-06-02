import gm from 'gm'
import path from 'path'
import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import {
    AssetType,
    IAsset,
    IAssetSearch,
    IAssetSearchCondition,
} from 'src/interface/asset.interface'
import { config } from 'src/shared/config'
import {
    getExt,
    isFileSync,
    readDirSync,
    removeFileSync,
    saveImage,
} from 'src/shared/file'
import {
    createQueryIds,
    forEachAsync,
    formatDate,
    mergeObjectToEntity,
    parseIds,
    patchQBIds,
    queryQBIds,
    throwValidatedErrors,
} from 'src/shared/utilities'
import { AssetGroupService } from 'src/assetGroup/assetGroup.service'
import { CharacterService } from 'src/character/character.service'
import { TagService } from 'src/tag/tag.service'
import { CategoryType } from 'src/interface/category.interface'
import { AssetSetService } from 'src/assetSet/assetSet.service'

import { AssetEntity } from './asset.entity'

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
    private _imageId = 0

    public async findById(
        id: number,
        relations: string[] = [],
        patch: boolean = false
    ) {
        const result = await this.assetRepo.findOne(
            id,
            relations
                ? {
                      relations,
                  }
                : {}
        )
        if (!result) throw new NotFoundException()
        if (patch) return this._patchAssetResult(result, true)
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

    public async removeAllUnstarAssets(recycle = false) {
        if (recycle) {
            const results = await this.assetRepo.find({
                recycle,
                star: false,
            })
            await forEachAsync(results, async (asset) => {
                await this.delete(asset)
            })
        } else {
            await this.assetRepo.update(
                {
                    recycle,
                    star: false,
                },
                { recycle: true }
            )
        }
    }

    public async findNearAssetsById(id: number, left: number, right: number) {
        const asset = await this.findById(id)

        let qb = this.assetRepo.createQueryBuilder('asset')
        let leftAssets: AssetEntity[] = []
        let rightAssets: AssetEntity[] = []
        let leftTotal = 0
        let rightTotal = 0

        if (left > 0) {
            const [assets, total] = await qb
                .where('asset.recycle = :recycle', {
                    recycle: !!asset.recycle,
                })
                .andWhere('asset.id < :id', {
                    id: id,
                })
                .orderBy(`asset.id`, 'DESC')
                .take(left)
                .getManyAndCount()
            leftAssets = assets
            leftTotal = total
        }

        if (right > 0) {
            const [assets, total] = await qb
                .where('asset.recycle = :recycle', {
                    recycle: !!asset.recycle,
                })
                .andWhere('asset.id > :id', {
                    id: id,
                })
                .orderBy(`asset.id`, 'ASC')
                .take(right)
                .getManyAndCount()
            rightAssets = assets
            rightTotal = total
        }

        await this._patchAssetResults(leftAssets)
        await this._patchAssetResults(rightAssets)

        return {
            left: leftAssets,
            leftTotal,
            right: rightAssets,
            rightTotal,
        }
    }

    private async _createConditionQB(condition: IAssetSearchCondition) {
        let qb = this.assetRepo
            .createQueryBuilder('asset')
            .where('asset.name like :name', {
                name: `%${condition.name ? condition.name : ''}%`,
            })
        if (condition.tagIds)
            qb = queryQBIds(
                qb,
                condition.tagIds,
                'asset.tagIds',
                condition?.reverse?.tagIds
            )
        if (condition.groupIds)
            qb = queryQBIds(qb, condition.groupIds, 'asset.groupIds')
        if (condition.characterIds)
            qb = queryQBIds(qb, condition.characterIds, 'asset.characterIds')
        if (condition.assetSetIds)
            qb = patchQBIds(
                qb,
                condition.assetSetIds,
                'asset.assetSets',
                'assetSet'
            )
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

        qb = qb.andWhere('asset.recycle = :recycle', {
            recycle: !!condition.recycle,
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

        const rows = data[0]
        await this._patchAssetResults(rows)
        return {
            page: Number(page),
            size: Number(size),
            rows,
            total: data[1],
        }
    }

    public async mergeTo(selfId: number, targetId: number) {
        const self = await this.findById(selfId)
        const target = await this.findById(targetId)
        if (self.filenames.length > 0) target.filenames.push(...self.filenames)
        await this.assetRepo.save(target)
        await this.assetRepo.remove(self)
    }

    private async _patchAssetResults(entities: AssetEntity[]) {
        await forEachAsync(entities, async (entity) => {
            await this._patchAssetResult(entity)
        })
    }

    private async _patchAssetResult(entity: AssetEntity, allFilenames = false) {
        if (entity.groupIds)
            Object.assign(
                entity,
                await this.groupService.findByIds(parseIds(entity.groupIds))
            )

        if (entity.tagIds)
            Object.assign(
                entity,
                await this.tagService.findRelationsByIds(
                    parseIds(entity.tagIds)
                )
            )

        if (entity.filenames.length > 0 && !allFilenames) {
            Object.assign(entity, { total: entity.filenames.length })
            entity.filenames = entity.filenames.splice(0, 3)
        }

        return entity
    }

    public async createSmallImage(filename: string) {
        switch (getExt(filename)) {
            case 'png':
            case 'bmp':
            case 'jpeg':
                if (!isFileSync(filename)) await this._saveAsset300(filename)
                break
        }
    }

    private async _saveAsset300(filename: string) {
        return new Promise((resolve, _) => {
            gm(path.join(config.static.assets, filename))
                .resize(400, 400)
                .write(
                    path.join(config.static.asset_thumbs, filename),
                    (err) => {
                        if (err) console.error(err)
                        resolve(undefined)
                    }
                )
        })
    }

    private async _saveImage(
        name: string,
        targetPath: string,
        originalPath: string,
        rename: boolean
    ) {
        try {
            const metadata = await saveImage(
                name,
                targetPath,
                originalPath,
                rename
            )
            return metadata
        } catch (err) {
            console.log(err)
            return null
        }
    }

    private async _saveFiles(
        filenames: string[],
        root = config.static.temps,
        rename = true
    ) {
        const name = `${Date.now()}-${++this._imageId}`
        const metadata = await this._saveImage(
            name,
            config.static.assets,
            path.join(root, filenames[0]),
            rename
        )
        if (metadata === null) throw 'cannot find the image'
        await this.createSmallImage(metadata.name)
        if (filenames.length > 1)
            await forEachAsync(filenames.splice(1), async (filename, index) => {
                await this._saveImage(
                    `${index + 1}`,
                    path.join(config.static.assets, name),
                    path.join(root, filename),
                    rename
                )
            })

        return metadata.name
    }

    private _sortFilenames(filenames: string[]) {
        return filenames
            .map((filename) => ({
                base: filename
                    .split('.')[0]
                    .split('_')
                    .map((num) => Number(num)),
                filename,
            }))
            .sort((a, b) => {
                const fn = (index: number): number => {
                    if (a.base[index] == null && b.base[index] == null) return 0
                    if (a.base[index] == null && b.base[index] != null)
                        return b.base[index]
                    if (a.base[index] != null && b.base[index] == null)
                        return a.base[index]
                    const result = a.base[index] - b.base[index]
                    if (result === 0) return fn((index += 1))
                    return result
                }
                return fn(0)
            })
            .map((result) => result.filename)
    }

    // TODO
    private async _saveFolder(foldername: string) {
        return foldername
    }

    private async _initAssets(target: AssetEntity, body: IAsset) {
        if (body.folder && body.assetType === AssetType.folder) {
            target.filename = await this._saveFolder(body.folder)
            return
        }
        let filenames = body.filenames
        if (body.folder)
            filenames = this._sortFilenames(readDirSync(body.folder))
        if (!filenames || filenames.length < 0) return
        if (filenames.length === 1) target.assetType = AssetType.file
        else target.assetType = AssetType.files
        if (body.folder)
            target.filename = await this._saveFiles(
                filenames,
                body.folder,
                false
            )
        else target.filename = await this._saveFiles(filenames)
    }

    private async _mergeBodyToEntity(target: AssetEntity, body: IAsset) {
        mergeObjectToEntity(target, body, [
            'tagIds',
            'folder',
            'groupIds',
            'filenames',
            'assetSetIds',
            'characterIds',
        ])

        await this._initAssets(target, body)

        if (body.tagIds != null)
            target.tagIds = createQueryIds(
                (
                    await this.tagService.matchByIds(
                        parseIds(body.tagIds),
                        CategoryType.asset
                    )
                ).map((tag) => tag.id)
            )
        if (body.groupIds != null)
            target.groupIds = createQueryIds(
                (
                    await this.groupService.findByIds(parseIds(body.groupIds))
                ).map((group) => group.id)
            )
        if (body.characterIds != null)
            target.characterIds = createQueryIds(
                (
                    await this.charService.findByIds(
                        parseIds(body.characterIds)
                    )
                ).map((char) => char.id)
            )
        if (body.assetSetIds != null)
            target.assetSets = await this.assetSetService.findByIds(
                parseIds(body.assetSetIds)
            )

        return target
    }

    public async create(body: IAsset) {
        if (!body.name)
            body.name = `${formatDate('y-M-d H:m:s', new Date())}-${++this
                ._nameId}`

        const asset = await this._mergeBodyToEntity(new AssetEntity(), body)
        await throwValidatedErrors(asset)
        return await this.assetRepo.save(asset)
    }

    public async findCategoryRelationsById(id: number) {
        const asset = await this.findById(id)
        return await this.tagService.tranformCategoryRelationByIds(
            parseIds(asset.tagIds)
        )
    }

    public async updateByIds(ids: number[], body: IAsset) {
        const errors = []
        for (let i = 0; i < ids.length; i++) {
            try {
                await this.update(ids[i], body)
            } catch (err) {
                errors.push(err)
            }
        }

        return {
            errors,
        }
    }

    public async deleteByIds(ids: number[]) {
        const assets: AssetEntity[] = []
        await forEachAsync(ids, async (id) => {
            const result = await this.delete(id)
            if (result) assets.push(result)
        })
        return assets
    }

    public async update(id: number, body: IAsset) {
        const asset = await this.findById(id)
        await this._mergeBodyToEntity(asset, body)
        await throwValidatedErrors(asset)
        const newPic = await this.assetRepo.save(asset)
        return await this.findById(newPic.id, [], true)
    }

    public async deleteExtraAssets() {
        const allAssetPaths = readDirSync(config.static.assets)
        const allAsset300Paths = readDirSync(config.static.asset_thumbs)
        const allAssets = await this.assetRepo.find()
        const bucket: Record<string, boolean> = {}
        let total = 0

        allAssets.forEach((asset) => {
            asset.filenames.forEach((filename) => {
                bucket[filename] = true
            })
        })
        allAssetPaths.forEach((filename) => {
            if (!bucket[filename] && filename != '300') {
                console.log('remove: ', filename)
                removeFileSync(path.join(config.static.assets, filename))
                total++
            }
        })
        allAsset300Paths.forEach((filename) => {
            if (!bucket[filename]) {
                console.log('remove 300: ', filename)
                removeFileSync(path.join(config.static.asset_thumbs, filename))
                total++
            }
        })

        return `remove ${total} extra assets`
    }

    public async delete(target: number | AssetEntity) {
        const asset =
            target instanceof AssetEntity ? target : await this.findById(target)
        const id = asset.id

        if (!asset.recycle) return await this.update(id, { recycle: true })

        const result = await this.assetRepo.remove(asset)

        await forEachAsync(result.filenames, async (filename, index) => {
            await saveImage(
                `${id}-${index}`,
                config.static.bin,
                path.join(config.static.assets, filename),
                true
            )
            removeFileSync(path.join(config.static.asset_thumbs, filename))
        })

        return result
    }
}
