import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ICharactership } from 'src/interface/charactership.interface'
import { CharactershipService } from './charactership.service'

@ApiTags('characterships')
@Controller('characterships')
export class CharactershipController {
    constructor(private readonly charshipService: CharactershipService) {}
    @Get()
    public async find() {
        return null
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async add(@Body() body: ICharactership) {
        return await this.charshipService.create(body)
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('type') type?: 'character' | 'relationship' | 'preview'
    ) {
        if (type === 'preview') {
            return await this.charshipService.findCharshipPreviews(id)
        } else if (type === 'character') {
            return await this.charshipService.findByCharId(id)
        } else if (type === 'relationship') {
            return await this.charshipService.findByRelatId(id)
        }
        return await this.charshipService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: ICharactership
    ) {
        return await this.charshipService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.charshipService.delete(id)
    }
}
