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
    HttpCode,
    Query,
    DefaultValuePipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { ICharacter } from 'src/interface/character.interface'
import { CharacterService } from './character.service'

@ApiTags('characters')
@Controller('characters')
export class CharacterController {
    constructor(private readonly charService: CharacterService) {}

    @Get()
    public async find(
        @Query('options') options?: string,
        @Query('ids') ids?: string,
        @Query('patch') patch?: boolean
    ) {
        if (ids)
            return await this.charService.findByIds(
                ids.split(',').map((id) => Number(id)),
                patch
            )
        else if (options)
            return await this.charService.search(JSON.parse(options))
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create character',
    })
    public async create(@Body() body: ICharacter) {
        return await this.charService.create(body)
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('relations', new DefaultValuePipe(''))
        relations: string
    ) {
        if (relations.includes('category'))
            return await this.charService.findCategoryRelationsById(id)
        return await this.charService.findById(
            id,
            relations ? relations.split(',') : undefined,
            true
        )
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: ICharacter
    ) {
        return await this.charService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.charService.delete(id)
    }
}
