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
import { IStoryChapter } from 'src/interface/storyChapter.interface'
import { StoryChapterService } from './storyChapter.service'

@ApiTags('storyChapters')
@Controller('storyChapters')
export class StoryChapterController {
    constructor(private readonly chapterService: StoryChapterService) {}

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
    public async create(@Body() body: IStoryChapter) {
        return await this.chapterService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.chapterService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: Omit<IStoryChapter, 'historyUUID'>
    ) {
        return await this.chapterService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.chapterService.delete(id)
    }
}
