import { In, Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { WikiEntity } from './wiki.entity'

@Injectable()
export class WikiService {
    constructor(
        @InjectRepository(WikiEntity)
        private readonly wikiRepo: Repository<WikiEntity>
    ) {}

    public async findAll() {
        return await this.wikiRepo.find()
    }

    public async findById(id: number) {
        const result = await this.wikiRepo.findOneBy({ id })
        if (!result) throw new NotFoundException()
        return result
    }

    public async findByIds(ids: number[]) {
        return await this.wikiRepo.findBy({ id: In(ids) })
    }

    public async findByCharId(charId: number) {
        return await this.wikiRepo.findOneBy({ characterId: charId })
    }

    public async create(charId: number) {
        const result = await this.findByCharId(charId)
        if (result) throw 'Every character only create one wiki page.'
        const chapter = new WikiEntity()
        chapter.characterId = charId
        return this.wikiRepo.save(chapter)
    }

    public async update(id: number, content: string) {
        const chapter = await this.findById(id)
        chapter.content = content
        return await this.wikiRepo.save(chapter)
    }

    public async delete(id: number) {
        const chapter = await this.findById(id)
        return await this.wikiRepo.delete(chapter.id)
    }
}
