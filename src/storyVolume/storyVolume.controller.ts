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
import { IStoryVolume } from 'src/interface/storyVolume.interface'
import { StoryVolumeService } from './storyVolume.service'

@ApiTags('storyVolumes')
@Controller('storyVolumes')
export class StoryVolumeController {
    constructor(private readonly storyVolumeService: StoryVolumeService) {}

    @Get()
    public async find(
        @Query('storyId', new ParseIntPipe()) storyId?: number,
        @Query('ids') ids?: string
    ) {
        if (storyId != null)
            return await this.storyVolumeService.findByStoryId(storyId)
        if (ids != null)
            return await this.storyVolumeService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return await this.storyVolumeService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async create(@Body() body: IStoryVolume) {
        return await this.storyVolumeService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.storyVolumeService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IStoryVolume
    ) {
        return await this.storyVolumeService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.storyVolumeService.delete(id)
    }
}
