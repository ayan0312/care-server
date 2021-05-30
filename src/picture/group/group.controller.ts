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
import { GroupService } from './group.service'

@ApiTags('picture_groups')
@Controller('picture/groups')
export class GroupController {
    constructor(private readonly groupService: GroupService) {}

    @Get()
    public async find(@Query('name', new DefaultValuePipe('')) name: string) {
        if (name) return await this.groupService.find(name)
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
