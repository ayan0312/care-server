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
    DefaultValuePipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { IStarName } from 'src/interface/name.interface'
import { AssetSetService } from './assetSet.service'

@ApiTags('character_asset_sets')
@Controller('character/assetSets')
export class AssetSetController {
    constructor(private readonly assetSetService: AssetSetService) {}

    @Get()
    public async find(@Query('name', new DefaultValuePipe('')) name: string) {
        if (name) return await this.assetSetService.find(name)
        return await this.assetSetService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create asset set',
    })
    public async create(@Body() body: IStarName) {
        return await this.assetSetService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.assetSetService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IStarName
    ) {
        return await this.assetSetService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.assetSetService.delete(id)
    }
}
