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
import { ApiResponse, ApiTags } from '@nestjs/swagger'
import { IStarName } from 'src/interface/name.interface'
import { AssetGroupService } from './assetGroup.service'

@ApiTags('asset_groups')
@Controller('asset/groups')
export class AssetGroupController {
    constructor(private readonly groupService: AssetGroupService) {}

    @Get()
    public async find(@Query('name') name: string, @Query('ids') ids: string) {
        if (name != null) return await this.groupService.find(name)
        if (ids != null)
            return await this.groupService.findByIds(
                ids.split(',').map((n) => Number(n))
            )
        return await this.groupService.findAll()
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'create group',
    })
    public async create(@Body() body: IStarName) {
        return await this.groupService.create(body)
    }

    @Get(':id')
    public async findById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.groupService.findById(id)
    }

    @Patch(':id')
    public async updateById(
        @Param('id', new ParseIntPipe()) id: number,
        @Body() body: IStarName
    ) {
        return await this.groupService.update(id, body)
    }

    @Delete(':id')
    public async deleteById(@Param('id', new ParseIntPipe()) id: number) {
        return await this.groupService.delete(id)
    }
}
