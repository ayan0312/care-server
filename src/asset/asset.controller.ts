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
    Query,
    ParseArrayPipe,
    DefaultValuePipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { IAsset } from 'src/interface/asset/asset.interface'
import { AssetService } from './asset.service'

@ApiTags('assets')
@Controller('assets')
export class AssetController {
    constructor(private readonly assetService: AssetService) {}

    @Get()
    public async find(@Query('options') options: string) {
        return await this.assetService.search(JSON.parse(options))
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create tag',
    })
    public async create(@Body() body: IAsset) {
        return await this.assetService.create(body)
    }

    @Patch()
    public async updateByIds(
        @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
        ids: number[],
        @Body() body: IAsset
    ) {
        return await this.assetService.updateByIds(ids, body)
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query(
            'relations',
            new DefaultValuePipe(''),
            new ParseArrayPipe({ items: String, separator: ',' })
        )
        relations: string[]
    ) {
        return await this.assetService.findById(id, relations)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IAsset
    ) {
        return await this.assetService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.assetService.delete(id)
    }
}
