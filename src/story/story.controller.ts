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
    ParseBoolPipe,
    DefaultValuePipe,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IStory } from 'src/interface/story.interface'
import { StoryService } from './story.service'

@ApiTags('storys')
@Controller('storys')
export class StoryController {
    constructor(private readonly storyService: StoryService) {}

    @Get()
    public async find(
        @Query('options') options?: string,
        @Query('ids') ids?: string
    ) {
        if (options != null)
            return await this.storyService.search(JSON.parse(options))
        if (ids != null)
            return await this.storyService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return await this.storyService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async create(@Body() body: IStory) {
        return await this.storyService.create(body)
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('update', new DefaultValuePipe(false), new ParseBoolPipe())
        update: boolean
    ) {
        if (update) return this.storyService.updateStoryNewest(id)
        return await this.storyService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IStory
    ) {
        return await this.storyService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.storyService.delete(id)
    }
}
