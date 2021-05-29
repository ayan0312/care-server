import {
    Get,
    Controller,
    Param,
    HttpStatus,
    Post,
    ParseIntPipe,
    Body,
    Delete,
    Patch,
    Query,
    HttpCode,
    ParseArrayPipe,
    DefaultValuePipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { ICharacterTag } from 'src/interface/character/tag.interface'
import { TagService } from './tag.service'

@ApiTags('character_tags')
@Controller('character/tags')
export class TagController {
    constructor(private readonly tagService: TagService) { }

    @Get()
    public async find(@Query() query: ICharacterTag) {
        return await this.tagService.find(query)
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create tag',
    })
    public async create(@Body() body: ICharacterTag) {
        return await this.tagService.create(body)
    }

    @Get('relation')
    public async findRelations(
        @Query('primary', new DefaultValuePipe(false)) primary: boolean,
        @Query(
            'ids',
            new DefaultValuePipe('-1'),
            new ParseArrayPipe({ items: Number, separator: ',' })
        )
        ids: number[]
    ) {
        if (ids.length > 0) {
            if (primary) return await this.tagService.findRelationsByIds(ids)
            return await this.tagService.tranformCategoryRelationByIds(ids)
        }

        return []
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.tagService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: ICharacterTag
    ) {
        return await this.tagService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.tagService.delete(id)
    }
}
