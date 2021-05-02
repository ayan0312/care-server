import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { RelationshipService } from './relationship.service'

@ApiTags('character_relationships')
@Controller('character/relationships')
export class RelationshipController {
    constructor(private readonly relationshipService: RelationshipService) {}

    @Get()
    public async findAll() {
        return this.relationshipService.findAll()
    }
}
