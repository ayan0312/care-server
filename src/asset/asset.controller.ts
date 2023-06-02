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
    ParseBoolPipe,
} from '@nestjs/common'
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { IAsset } from 'src/interface/asset.interface'
import { AssetService } from './asset.service'
import { createReadStream } from 'fs'
import { config } from 'src/shared/config'

@ApiTags('assets')
@Controller('assets')
export class AssetController {
    constructor(private readonly assetService: AssetService) {}

    @Get()
    public async find(
        @Query('options') options: string,
        @Query('near') nearOpts?: string
    ) {
        if (nearOpts) {
            const result = JSON.parse(nearOpts)
            return await this.assetService.findNearAssetsById(
                result.id,
                result.left,
                result.right
            )
        }
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

    @Post('merger')
    public async mergeTo(@Body() body: { self: number; target: number }) {
        return await this.assetService.mergeTo(body.self, body.target)
    }

    @Patch()
    public async updateByIds(
        @Query('ids', new ParseArrayPipe({ items: Number, separator: ',' }))
        ids: number[],
        @Body() body: IAsset
    ) {
        return await this.assetService.updateByIds(ids, body)
    }

    @Delete()
    public async deleteByIds(
        @Query(
            'ids',
            new DefaultValuePipe(''),
            new ParseArrayPipe({ items: Number, separator: ',' })
        )
        ids: number[],
        @Query('unstar', new DefaultValuePipe(false), new ParseBoolPipe())
        unstar: boolean,
        @Query('recycle', new DefaultValuePipe(false), new ParseBoolPipe())
        recycle: boolean
    ) {
        if (unstar) {
            await this.assetService.removeAllUnstarAssets(recycle)
            return ''
        }
        return await this.assetService.deleteByIds(ids)
    }

    @Delete('/unstar')
    public async deleteAllUnstars(
        @Query('recycle', new DefaultValuePipe(false), new ParseBoolPipe())
        recycle: boolean
    ) {
        return await this.assetService.removeAllUnstarAssets(recycle)
    }

    @Get('thumb/:id')
    getAssetThumb(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('index', new DefaultValuePipe('')) index = 0
    ) {
        const file = createReadStream(config.static.assets)
        // return new StreamableFile(file)
    }

    @Get(':id')
    public async findById(
        @Param('id', new ParseIntPipe()) id: number,
        @Query('relations', new DefaultValuePipe(''))
        relations: string
    ) {
        if (relations.includes('category'))
            return await this.assetService.findCategoryRelationsById(id)
        return await this.assetService.findById(
            id,
            relations ? relations.split(',') : undefined,
            true
        )
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
