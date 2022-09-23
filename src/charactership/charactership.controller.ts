import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ICharactership } from 'src/interface/charactership.interface'
import { CharactershipService } from './charactership.service'

@ApiTags('characterships')
@Controller('characterships')
export class CharactershipController {
    constructor(private readonly charactershipService: CharactershipService) {}
}
