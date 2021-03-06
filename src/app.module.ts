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
import { AssetSetModule } from './assetSet/assetSet.module'
import { TagModule } from './tag/tag.module'
import { AssetGroupModule } from './assetGroup/assetGroup.module'
import { CharacterGroupModule } from './characterGroup/characterGroup.module'
import { ExtensionModule } from './extension/extension.module'
import { StaticCategoryModule } from './staticCategory/staticCategory.module'
import { RelationshipModule } from './relationship/relationship.module'
import { AppGateway } from './app.gateway'

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'better-sqlite3',
            database: config.DATABASE_FILENAME,
            synchronize: true,
            autoLoadEntities: true,
        }),
        ServeStaticModule.forRoot({
            rootPath: config.STORAGE_PATH,
            exclude: [config.DATABASE_FILENAME],
            serveStaticOptions: {
                cacheControl: true,
                maxAge: 60 * 60 * 24 * 365,
            },
        }),
        MulterModule,
        TagModule,
        TempModule,
        AssetModule,
        AssetSetModule,
        CategoryModule,
        CharacterModule,
        ExtensionModule,
        AssetGroupModule,
        RelationshipModule,
        CharacterGroupModule,
        StaticCategoryModule,
    ],
    controllers: [AppController],
    providers: [AppGateway],
})
export class ApplicationModule {
    constructor(private readonly connection: Connection) {}
}
