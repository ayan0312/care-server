import { Connection } from 'typeorm'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'

import { AppController } from './app.controller'
import { CharacterModule } from './character/character.module'
import { config } from './shared/config'
import { TempModule } from './temp/temp.module'
import { PictureEntity } from './picture/picture.entity'
import { PictureTagEntity } from './picture/tag/tag.entity'
import { PictureGroupEntity } from './picture/group/group.entity'
import { PictureCategoryEntity } from './picture/category/category.entity'
import { ServeStaticModule } from '@nestjs/serve-static'

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: config.DATABASE_FILENAME,
            entities: [
                PictureEntity,
                PictureTagEntity,
                PictureGroupEntity,
                PictureCategoryEntity
            ],
            synchronize: true,
            autoLoadEntities: true,
        }),
        ServeStaticModule.forRoot({
            rootPath: config.STORAGE_PATH,
            exclude: [config.DATABASE_FILENAME]
        }),
        MulterModule,
        TempModule,
        CharacterModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class ApplicationModule {
    constructor(private readonly connection: Connection) { }
}
