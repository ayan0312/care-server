import fs from 'fs'
import gm from 'gm'
import path from 'path'
import got from 'got'
import { URL } from 'url'
import { pipeline } from 'stream'
import { IncomingMessage } from 'http'
import { fromFile, fromStream } from 'file-type'

export interface FileMetadata {
    ext: string
    name: string
    path: string
    size: number
    mimetype?: string
    filename: string
    originalname?: string
}

export function download(url: string, prefix: string, outputPath: string) {
    autoMkdirSync(outputPath)
    const readStream = got.stream(url)
    return new Promise((resolve: (metadata: FileMetadata) => void, reject) => {
        readStream.on('response', async (response: IncomingMessage) => {
            let ext = path.extname(new URL(url).pathname)
            const mimetype = response.headers['content-type']
            if (!ext)
                ext = mimetype
                    ? mimetype.split('/')[1]
                    : (await fromStream(readStream))?.ext || ''
            const name = `${prefix}.${ext}`
            const filename = `${outputPath}/${name}`

            readStream.off('error', reject)
            pipeline(readStream, fs.createWriteStream(filename), (err) => {
                if (err) {
                    reject(err.message)
                    return
                }

                const size = fs.statSync(filename).size

                resolve({
                    name,
                    size,
                    ext,
                    path: outputPath,
                    filename,
                    mimetype: mimetype || '',
                    originalname: url,
                })
            })
        })
    })
}

function getImageType(filename: string): string | false {
    if (filename.indexOf('.') <= -1) return false
    const types = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']
    const arr = filename.split('.')
    const type = arr[arr.length - 1]
    if (!types.includes(type)) return false
    return type
}

function copyImage(oldPath: string, newPath: string): Promise<void> {
    let readStream = fs.createReadStream(oldPath)
    let writeStream = fs.createWriteStream(newPath)
    readStream.pipe(writeStream)

    return new Promise((resolve, reject) => {
        readStream.on('error', (err) => {
            reject(err)
        })

        writeStream.on('finish', () => {
            writeStream.end()
            resolve()
        })
    })
}

function renameImage(oldPath: string, newPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                reject(err)
                return
            }
            resolve()
        })
    })
}

export function autoMkdirSync(path: string) {
    if (!fs.existsSync(path)) fs.mkdirSync(path, { recursive: true })
}

export async function saveImage(
    sign: string,
    path: string,
    originFilename: string,
    rename?: boolean
) {
    let size = fs.statSync(originFilename).size
    autoMkdirSync(path)

    const ext = (await fromFile(originFilename))?.ext || ''
    const metadata: FileMetadata = {
        ext,
        path,
        size,
        name: `${sign}.${ext}`,
        filename: `${path}/${sign}.${ext}`,
    }

    if (rename) await renameImage(originFilename, metadata.filename)
    else await copyImage(originFilename, metadata.filename)

    return metadata
}

export async function getImageSize(filename: string) {
    return new Promise((resolve: (size: gm.Dimensions) => void, reject) => {
        gm(filename).size((err, size) => {
            if (err) {
                reject(err)
                return
            }
            resolve(size)
        })
    })
}

const limit = 1024 * 1024 * 200

export async function clipImage(
    origin: string,
    target: string,
    maxWidth: number
) {
    const size = await getImageSize(origin)
    let width = maxWidth

    if (size.width < width) return false

    return new Promise((resolve: (d: true) => void, reject) => {
        gm(origin)
            .resize(width)
            .write(target, (err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
    })
}
