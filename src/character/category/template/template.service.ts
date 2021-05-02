import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

import { CategoryTemplateEntity } from './template.entity'

@Injectable()
export class CategoryTemplateService {
    constructor(
        @InjectRepository(CategoryTemplateEntity)
        private readonly categoryRepo: Repository<CategoryTemplateEntity>
    ) {}

    public async findAll() {}
}
