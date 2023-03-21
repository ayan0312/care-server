import {
    Controller,
    DefaultValuePipe,
    Get,
    Logger,
    ParseBoolPipe,
    Post,
    PreconditionFailedException,
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
import { clipImage, download } from 'src/shared/image'
import { URL } from 'url'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs-extra'
import { ErrorCodeException, ErrorCodes } from 'src/shared/errorCodes'
import { AssetService } from 'src/asset/asset.service'

function getExt(file: Express.Multer.File) {
    let exts = file.mimetype.split('/')
    if (file.mimetype === 'application/octet-stream')
        exts = file.originalname.split('.')
    return exts[exts.length - 1]
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, config.TEMP_PATH)
    },
    filename: function (req, file, cb) {
        cb(null, `${uuidv4()}.${getExt(file)}`)
    },
})

const expireMap = new ExpireMap<string>(60 * 5)
expireMap.on('delete', (filename: string) => {
    fs.remove(filename)
})

@ApiTags('temps')
@Controller('temps')
export class TempController {
    constructor(private readonly assetService: AssetService) {}

    private logger = new Logger('Temps')

    @Get('download/file')
    public async download(@Query('opts') opts: string) {
        const {
            url,
            path = 'C:/Users/ayan0312/Desktop/Images',
            name,
            folder = '',
            timeout = 30 * 1000,
        } = JSON.parse(decodeURI(opts))
        if (!url || !path || !name) throw 'params'
        try {
            return await download(url, name, `${path}/${folder}`, timeout)
        } catch (err: any) {
            if (err?.code === 'ETIMEDOUT')
                throw new ErrorCodeException({
                    code: ErrorCodes.TIME_OUT,
                    message: err.message,
                })
            throw err
        }
    }

    @Get('download/image')
    public async downloadImage(
        @Query('thumb', new ParseBoolPipe(), new DefaultValuePipe(false))
        thumb: boolean,
        @Query('width', new DefaultValuePipe(300)) width: number,
        @Query('url') base64?: string
    ) {
        if (!base64) throw new PreconditionFailedException()
        const url = Buffer.from(base64, 'base64').toString()
        this.logger.log('Downloading the image:\n' + url)
        const metadata = await download(url, uuidv4(), config.TEMP_PATH)
        this.logger.log('Successfully downloaded the image:\n' + url)

        let original_preview = new URL(metadata.name, config.URL.TEMP_PATH)
        let thumb_filename = `${width}_${metadata.name}`

        if (thumb) {
            const thumb_fi = path.resolve(config.TEMP_PATH, thumb_filename)
            let result = false
            try {
                this.logger.log('Clipping the image:\n' + url)
                result = await clipImage(
                    path.resolve(config.TEMP_PATH, metadata.name),
                    thumb_fi,
                    width
                )
            } catch (err) {
                this.logger.error(err)
                throw 'Cannot clips the image:\n' + url
            }
            this.logger.log('Successfully clipped image:\n' + url)
            if (result) expireMap.push(String(Date.now()), thumb_fi)
            else thumb_filename = metadata.name
        }

        return {
            size: metadata.size,
            thumb: thumb ? new URL(thumb_filename, config.URL.TEMP_PATH) : '',
            suffix: metadata.ext,
            prefix: metadata.prefix,
            mimetype: metadata.mimetype || '',
            filename: metadata.name,
            original_name: metadata.originalname || '',
            original_preview,
        }
    }

    @Post('blob')
    @UseInterceptors(
        FileInterceptor('image', {
            storage,
            preservePath: true,
        })
    )
    public async uploadBlobImage(
        @UploadedFile() file: Express.Multer.File,
        @Query('asset', new DefaultValuePipe(false), new ParseBoolPipe())
        asset: boolean,
        @Query('version') version: string
    ) {
        if (asset) {
            let name = `NovelAI ${version}`
            if (file.originalname.includes('EXPERIMENT'))
                name = `${name} EXPERIMENT`
            return await this.assetService.create({
                name,
                intro: file.originalname,
                tagIds: '1067',
                filenames: [file.filename],
            })
        }
        return file.filename
    }

    @Get('upload/folder')
    public async uploadFolder(@Query('folder') folder: string) {}

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

        switch (file.mimetype) {
            case 'image/png':
            case 'image/bmp':
            case 'image/jpeg':
                if (thumb) {
                    const thumb_fi = path.resolve(
                        config.TEMP_PATH,
                        thumb_filename
                    )
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
                break
            // other mimetypes doesn't clip it.
            default:
                thumb_filename = file.filename
                break
        }

        let prefixs = file.originalname.split('.')
        prefixs.pop()
        return {
            size: file.size,
            thumb: thumb ? new URL(thumb_filename, config.URL.TEMP_PATH) : '',
            suffix: getExt(file),
            prefix: prefixs.join('.'),
            mimetype: file.mimetype,
            filename: file.filename,
            original_name: file.originalname,
            original_preview,
        }
    }
}
