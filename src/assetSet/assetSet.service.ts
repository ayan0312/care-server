import { Repository } from 'typeorm'
import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { mergeObjectToEntity, throwValidatedErrors } from 'src/shared/utilities'
import { CharacterAssetSetEntity } from './assetSet.entity'
import {
    IAssetSet,
    IAssetSetSearch,
    IAssetSetSearchCondition,
} from 'src/interface/assetSet.interface'
import { CharacterService } from '../character/character.service'
import { ModuleRef } from '@nestjs/core'
import { AssetService } from 'src/asset/asset.service'
import { CharacterEntity } from '../character/character.entity'

@Injectable()
export class AssetSetService implements OnModuleInit {
    constructor(
        @InjectRepository(CharacterAssetSetEntity)
        private readonly assetSetRepo: Repository<CharacterAssetSetEntity>,
        private readonly charService: CharacterService,
        private readonly moduleRef: ModuleRef
    ) {}

    private assetService: AssetService

    public onModuleInit() {
        this.assetService = this.moduleRef.get(AssetService, { strict: false })
    }

    public async find(name: string) {
        return await this.assetSetRepo.findBy({ name })
    }

    public async search(body: IAssetSetSearch) {
        const {
            condition = { name: '' },
            orderBy = { sort: 'created', order: 'DESC' },
            size = 20,
            page = 1,
        } = body

        let qb = this._createConditionQB(condition)
        if (orderBy != null)
            qb = qb.orderBy(`assetSet.${orderBy.sort}`, orderBy.order)

        const data = await qb
            .skip(size * (page - 1))
            .take(size)
            .getManyAndCount()

        const rows = data[0]
        for (let i = 0; i < rows.length; i++) {
            const result = await this.assetService.search({
                page: 1,
                size: 1,
                condition: {
                    assetSetIds: String(rows[i].id),
                },
            })
            rows[i] = Object.assign({}, rows[i], {
                assetCount: result.total,
                firstAsset: result.rows[0] || null,
            })
        }

        return {
            page: Number(page),
            size: Number(size),
            rows,
            total: data[1],
        }
    }

    private _createConditionQB(condition: IAssetSetSearchCondition) {
        let qb = this.assetSetRepo
            .createQueryBuilder('assetSet')
            .where('assetSet.name like :name', {
                name: `%${condition.name ? condition.name : ''}%`,
            })

        if (condition.assetIds != null)
            qb = qb
                .leftJoin('assetSet.assets', 'asset')
                .andWhere('asset.id IN (:...assetIds)', {
                    assetIds: condition.assetIds.split(','),
                })
        if (condition.characterId != null)
            qb = qb
                .leftJoin('assetSet.character', 'character')
                .andWhere('character.id = :characterId', {
                    characterId: condition.characterId,
                })
        if (condition.star != null)
            qb = qb.andWhere('assetSet.star = :star', {
                star: !!condition.star,
            })
        if (condition.rating != null)
            qb = qb.andWhere('assetSet.rating = :rating', {
                rating: condition.rating,
            })

        return qb
    }

    public async findById(id: number) {
        const result = await this.assetSetRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.assetSetRepo.findByIds(ids)
    }

    private async _mergeBodyToEntity(
        target: CharacterAssetSetEntity,
        body: IAssetSet
    ) {
        mergeObjectToEntity(target, body, ['characterId'])

        if (body.characterId != null)
            target.character = await this.charService.findById(body.characterId)

        return target
    }

    public async create(body: IAssetSet) {
        const assetSet = new CharacterAssetSetEntity()
        if (!body.characterId)
            throw new BadRequestException('asset set must belong character')

        await this._mergeBodyToEntity(assetSet, body)
        await throwValidatedErrors(assetSet)

        if (assetSet.name && assetSet.character)
            if (
                assetSet.name !== body.name &&
                (await this.hasName(assetSet.name, assetSet.character))
            )
                throw new ConflictException('has the same name')

        return this.assetSetRepo.save(assetSet)
    }

    public async update(id: number, body: IAssetSet) {
        const assetSet = await this.findById(id)

        await this._mergeBodyToEntity(assetSet, body)
        await throwValidatedErrors(assetSet)

        if (assetSet.name && assetSet.character)
            if (
                assetSet.name !== body.name &&
                (await this.hasName(assetSet.name, assetSet.character))
            )
                throw new ConflictException('has the same name')

        return await this.assetSetRepo.save(assetSet)
    }

    public async delete(id: number) {
        const assetSet = await this.findById(id)
        const result = await this.assetService.search({
            page: 1,
            size: 1,
            condition: {
                assetSetIds: String(id),
            },
        })

        if (result.rows.length > 0)
            throw new BadRequestException(
                'please remove all assets in assetSet before delete assetSet'
            )
        return await this.assetSetRepo.remove(assetSet)
    }

    public async hasName(name: string, char: CharacterEntity) {
        const assetSet = await this.assetSetRepo.findOneBy({
            name,
            character: {
                id: char.id,
            },
        })
        return !!assetSet
    }
}
