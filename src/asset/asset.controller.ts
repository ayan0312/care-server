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
    constructor(private readonly picService: AssetService) {}

    @Get()
    public async find(@Query('options') options: string) {
        return await this.picService.search(JSON.parse(options))
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create tag',
    })
    public async create(@Body() body: IAsset) {
        return await this.picService.create(body)
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
        return await this.picService.findById(id, relations)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IAsset
    ) {
        return await this.picService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.picService.delete(id)
    }
}