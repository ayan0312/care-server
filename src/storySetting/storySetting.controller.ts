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
import { IStorySetting } from 'src/interface/storySetting.interface'
import { StorySettingService } from './storySetting.service'

@ApiTags('storys')
@Controller('storys')
export class StorySettingController {
    constructor(private readonly storySettingService: StorySettingService) {}

    @Get()
    public async find(
        @Query('options') options?: string,
        @Query('ids') ids?: string
    ) {
        if (options != null)
            return await this.storySettingService.search(JSON.parse(options))
        if (ids != null)
            return await this.storySettingService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return this.storySettingService.find({})
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async create(@Body() body: IStorySetting) {
        return await this.storySettingService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.storySettingService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IStorySetting
    ) {
        return await this.storySettingService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.storySettingService.delete(id)
    }
}
