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
import { IDiary } from 'src/interface/diary.interface'
import { DiaryService } from './diary.service'

@ApiTags('diaries')
@Controller('diaries')
export class DiaryController {
    constructor(private readonly diaryService: DiaryService) {}

    @Get()
    public async find(
        @Query('options') options?: string,
        @Query('ids') ids?: string
    ) {
        if (options != null)
            return await this.diaryService.search(JSON.parse(options))
        if (ids != null)
            return await this.diaryService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return await this.diaryService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async create(@Body() body: IDiary) {
        return await this.diaryService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.diaryService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: Omit<IDiary, 'historyUUID'>
    ) {
        return await this.diaryService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.diaryService.delete(id)
    }
}
