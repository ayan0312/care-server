import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IRelationship } from 'src/interface/relationship.interface'
import { RelationshipService } from './relationship.service'

@ApiTags('relationships')
@Controller('relationships')
export class RelationshipController {
    constructor(private readonly relationshipService: RelationshipService) {}
    @Get()
    public async find(
        @Query('name') name?: string,
        @Query('selfName') selfName?: string,
        @Query('targetName') targetName?: string
    ) {
        const body: IRelationship = {}
        if (name) body.name = name
        if (selfName) body.selfName = name
        if (targetName) body.targetName = name
        return await this.relationshipService.find(body)
    }

    @Post()
    public async create(@Body() body: IRelationship) {
        return await this.relationshipService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.relationshipService.findById(id)
    }

    @Patch(':id')
    public async renameById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IRelationship
    ) {
        return await this.relationshipService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.relationshipService.delete(id)
    }
}
