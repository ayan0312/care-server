import { Connection } from 'typeorm'
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MulterModule } from '@nestjs/platform-express'

import { AppController } from './app.controller'
import { CharacterModule } from './character/character.module'
import { config } from './shared/config'
import { TempModule } from './temp/temp.module'
import { ServeStaticModule } from '@nestjs/serve-static'
import { AssetModule } from './asset/asset.module'
import { CategoryModule } from './category/category.module'
import { TagModule } from './tag/tag.module'
import { StaticCategoryModule } from './staticCategory/staticCategory.module'
import { RelationshipModule } from './relationship/relationship.module'
import { CharactershipModule } from './charactership/charactership.module'
import { WikiModule } from './wiki/wiki.module'

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: config.database,
            synchronize: true,
            autoLoadEntities: true,
        }),
        ServeStaticModule.forRoot({
            rootPath: config.storage,
            exclude: ['/api*'],
            serveStaticOptions: {
                cacheControl: true,
                maxAge: 60 * 60 * 24 * 365,
            },
        }),
        MulterModule,
        TagModule,
        TempModule,
        WikiModule,
        AssetModule,
        CategoryModule,
        CharacterModule,
        RelationshipModule,
        CharactershipModule,
        StaticCategoryModule,
    ],
    controllers: [AppController],
    providers: [],
})
export class ApplicationModule {
    constructor(private readonly connection: Connection) {}
}
