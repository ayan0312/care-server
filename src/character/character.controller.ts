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
    ParseBoolPipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { ICharacter } from 'src/interface/character.interface'
import { parseIds } from 'src/shared/utilities'
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
        if (ids) return await this.charService.findByIds(parseIds(ids), patch)
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

    @Delete('/extra')
    public async deleteAllExtraAssets() {
        return await this.charService.deleteExtraAssets()
    }

    @Patch()
    public async updateByIds(
        @Body() body: { ids: number[]; char: ICharacter }
    ) {
        return 'Not Implemented'
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('relations', new DefaultValuePipe('')) relations: string,
        @Query('patch', new ParseBoolPipe()) patch?: boolean
    ) {
        if (relations.includes('category'))
            return await this.charService.findCategoryRelationsById(id)
        return await this.charService.findById(id, patch)
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
