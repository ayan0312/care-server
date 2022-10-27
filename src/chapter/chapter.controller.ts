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
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IChapter } from 'src/interface/chapter.interface'
import { ChapterService } from './chapter.service'

@ApiTags('chapters')
@Controller('chapters')
export class ChapterController {
    constructor(private readonly chapterService: ChapterService) {}

    @Get()
    public async find(
        @Query('options') options?: string,
        @Query('ids') ids?: string
    ) {
        if (options != null)
            return await this.chapterService.search(JSON.parse(options))
        if (ids != null)
            return await this.chapterService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return await this.chapterService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async create(@Body() body: IChapter) {
        return await this.chapterService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.chapterService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IChapter
    ) {
        return await this.chapterService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.chapterService.delete(id)
    }
}
