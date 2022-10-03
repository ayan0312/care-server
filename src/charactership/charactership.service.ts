import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { CharacterEntity } from 'src/character/character.entity'
import { CharacterService } from 'src/character/character.service'
import { ICharactership } from 'src/interface/charactership.interface'
import { RelationshipService } from 'src/relationship/relationship.service'
import { forEachAsync, throwValidatedErrors } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { CharactershipEntity } from './charactership.entity'
@Injectable()
export class CharactershipService {
    constructor(
        @InjectRepository(CharactershipEntity)
        private readonly charshipRepo: Repository<CharactershipEntity>,
        private readonly charService: CharacterService,
        private readonly relatService: RelationshipService
    ) {}

    public async findById(id: number) {
        const result = await this.charshipRepo.findOne(id)
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByRelatId(id: number) {
        return await this.charshipRepo.find({ relationshipId: id })
    }

    public async findByCharId(id: number) {
        const chars: CharactershipEntity[] = []
        return chars
            .concat(
                await this.charshipRepo.find({ selfId: id }),
                await this.charshipRepo.find({
                    targetId: id,
                })
            )
            .sort((a, b) => a.relationshipId - b.relationshipId)
    }

    public async findCharshipPreviews(charId: number) {
        const charships = await this.findByCharId(charId)
        const previewMap: { [relationship: string]: CharacterEntity[] } = {}
        await forEachAsync(charships, async (charship) => {
            const relationship = await this.relatService.findById(
                charship.relationshipId
            )
            if (charId === charship.selfId) {
                const char = await this.charService.findById(charship.targetId)
                if (!previewMap[relationship.targetName])
                    previewMap[relationship.targetName] = []
                previewMap[relationship.targetName].push(char)
            } else {
                const char = await this.charService.findById(charship.selfId)
                if (!previewMap[relationship.selfName])
                    previewMap[relationship.selfName] = []
                previewMap[relationship.selfName].push(char)
            }
        })

        const previews: {
            relationship: string
            characters: CharacterEntity[]
        }[] = []
        Object.keys(previewMap).forEach((key) => {
            previews.push({
                relationship: key,
                characters: previewMap[key].slice(),
            })
        })
        return previews
    }

    private async _checkRelat(id: number) {
        const result = await this.relatService.findById(id)
        if (!result) throw new NotFoundException('Not found the relationship')
    }

    private async _checkChar(id: number) {
        const result = await this.charService.findById(id)
        if (!result) throw new NotFoundException('Not found the character')
    }

    private async _mergeBodyToEntity(
        target: CharactershipEntity,
        body: ICharactership
    ) {
        if (body.selfId) {
            await this._checkChar(body.selfId)
            target.selfId = body.selfId
        }
        if (body.targetId) {
            await this._checkChar(body.targetId)
            target.targetId = body.targetId
        }

        if (target.targetId === target.selfId) {
            throw new BadRequestException(
                'The selfId cannot be the same as the targetId '
            )
        }
        if (body.relationshipId) {
            await this._checkRelat(body.relationshipId)
            target.relationshipId = body.relationshipId
        }
        return target
    }

    public async create(body: ICharactership) {
        const charship = await this._mergeBodyToEntity(
            new CharactershipEntity(),
            body
        )
        await throwValidatedErrors(charship)
        return this.charshipRepo.save(charship)
    }

    public async update(id: number, body: ICharactership) {
        const charship = await this.findById(id)
        await this._mergeBodyToEntity(charship, body)
        await throwValidatedErrors(charship)
        return this.charshipRepo.save(charship)
    }

    public async delete(id: number) {
        return await this.charshipRepo.delete(id)
    }
}
