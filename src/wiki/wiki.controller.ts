import {
    Get,
    Controller,
    Param,
    Post,
    ParseIntPipe,
    Body,
    Delete,
    Patch,
    Query,
    DefaultValuePipe,
    ParseBoolPipe,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IWiki } from 'src/interface/wiki.interface'
import { WikiService } from './wiki.service'

@ApiTags('wikis')
@Controller('wikis')
export class WikiController {
    constructor(private readonly wikiService: WikiService) {}

    @Get()
    public async find(@Query('ids') ids?: string) {
        if (ids != null)
            return await this.wikiService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return await this.wikiService.findAll()
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('character', new ParseBoolPipe(), new DefaultValuePipe(false))
        character?: boolean
    ) {
        if (character) return await this.wikiService.findByCharId(id)
        return await this.wikiService.findById(id)
    }

    @Post()
    public async create(@Body() body: IWiki) {
        if (body.characterId)
            return await this.wikiService.create(body.characterId)
        throw 'The character id was needed.'
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IWiki
    ) {
        return await this.wikiService.update(id, body.content || '')
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.wikiService.delete(id)
    }
}
