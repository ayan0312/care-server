import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ICharactership } from 'src/interface/charactership.interface'
import { throwValidatedErrors } from 'src/shared/utilities'
import { Repository } from 'typeorm'
import { CharactershipEntity } from './charactership.entity'
@Injectable()
export class CharactershipService {
    constructor(
        @InjectRepository(CharactershipEntity)
        private readonly charactershipRepo: Repository<CharactershipEntity>
    ) {}
}
