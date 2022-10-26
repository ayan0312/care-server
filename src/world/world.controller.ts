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
import { IWorld } from 'src/interface/world.interface'
import { WorldService } from './world.service'

@ApiTags('world')
@Controller('world')
export class WorldController {
    constructor(private readonly worldService: WorldService) {}

    @Get()
    public async find(
        @Query('options') options?: string,
        @Query('ids') ids?: string
    ) {
        if (options != null)
            return await this.worldService.search(JSON.parse(options))
        if (ids != null)
            return await this.worldService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return await this.worldService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    public async create(@Body() body: IWorld) {
        return await this.worldService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.worldService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IWorld
    ) {
        return await this.worldService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.worldService.delete(id)
    }
}
