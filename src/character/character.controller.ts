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
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { ICharacter, ICharacterSearch } from 'src/interface/character/character.interface'
import { CharacterService } from './character.service'

@ApiTags('characters')
@Controller('characters')
export class CharacterController {
    constructor(private readonly charService: CharacterService) { }

    @Get()
    public async find(
        @Body() body: ICharacterSearch
    ) {
        return await this.charService.search(body)
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create tag',
    })
    public async create(@Body() body: ICharacter) {
        return await this.charService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.charService.findById(id)
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
