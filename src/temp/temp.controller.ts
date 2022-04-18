import {
    Controller,
    DefaultValuePipe,
    Post,
    Query,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiTags } from '@nestjs/swagger'
import multer from 'multer'
import path from 'path'
import { config } from 'src/shared/config'
import { ExpireMap } from 'src/shared/expire'
import { clipImage } from 'src/shared/image'
import { URL } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs-extra'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.TEMP_PATH)
    },
    filename: function (req, file, cb) {
        let exts = file.mimetype.split('/')
        let ext = exts[exts.length - 1]
        cb(null, `${uuidv4()}.${ext}`)
    },
})

const expireMap = new ExpireMap<string>(60 * 5)
expireMap.on('delete', (filename: string) => {
    fs.remove(filename)
})

@ApiTags('temps')
@Controller('temps')
export class TempController {
    constructor() {}

    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            storage,
            preservePath: true,
        })
    )
    public async uploadImage(
        @UploadedFile() file: Express.Multer.File,
        @Query('thumb', new DefaultValuePipe(false)) thumb: boolean,
        @Query('width', new DefaultValuePipe(300)) width: number
    ) {
        let original_preview = new URL(file.filename, config.URL.TEMP_PATH)
        let thumb_filename = `${width}_${file.filename}`

        if (thumb) {
            const thumb_fi = path.resolve(config.TEMP_PATH, thumb_filename)
            let result = false
            try {
                result = await clipImage(
                    path.resolve(config.TEMP_PATH, file.filename),
                    thumb_fi,
                    width
                )
            } catch (err) {
                throw err
            }

            if (result) expireMap.push(String(Date.now()), thumb_fi)
            else thumb_filename = file.filename
        }

        return {
            size: file.size,
            thumb: thumb ? new URL(thumb_filename, config.URL.TEMP_PATH) : '',
            suffix: file.mimetype.split('/')[1],
            mimetype: file.mimetype,
            filename: file.filename,
            original_name: file.originalname,
            original_preview,
        }
    }
}
