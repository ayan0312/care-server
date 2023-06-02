import fs from 'fs'
import gm from 'gm'
import path from 'path'
import got from 'got'
import { URL } from 'url'
import { pipeline } from 'stream'
import { IncomingMessage } from 'http'
import { fromStream } from 'file-type'

export interface FileMetadata {
    ext: string
    name: string
    path: string
    size: number
    prefix: string
    mimetype?: string
    filename: string
    originalname?: string
}

export function download(
    url: string,
    prefix: string,
    outputPath: string,
    timeout?: number
) {
    autoMkdirSync(outputPath)
    const readStream = got.stream(url, timeout ? { timeout } : {})
    return new Promise((resolve: (metadata: FileMetadata) => void, reject) => {
        readStream.once('error', (err) => reject(err))
        readStream.once('response', async (response: IncomingMessage) => {
            let ext = path.extname(new URL(url).pathname)
            const mimetype = response.headers['content-type']
            if (!ext)
                ext = mimetype
                    ? mimetype.split('/')[1]
                    : (await fromStream(readStream))?.ext || ''
            // '.any'
            else ext = ext.split('.')[1]
            const name = `${prefix}.${ext}`
            const filename = `${outputPath}/${name}`

            if (fs.existsSync(filename)) {
                reject('Forbid to overwrite file: ' + filename)
                return
            }

            const writeStream = fs.createWriteStream(filename)
            pipeline(readStream, writeStream, (err) => {
                if (err) {
                    fs.rmSync(filename)
                    reject(err)
                    return
                }
                const size = fs.statSync(filename).size

                resolve({
                    name,
                    size,
                    ext,
                    path: outputPath,
                    prefix,
                    filename,
                    mimetype: mimetype || '',
                    originalname: url,
                })
            })
        })
    })
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

export function getExt(filename: string) {
    return filename.split('.').pop() || ''
}

export function getPrefix(filename: string) {
    const arr = filename.split('.')
    arr.pop()
    return arr.join('.')
}

export async function saveImage(
    prefix: string,
    path: string,
    originFilename: string,
    rename?: boolean
) {
    let size = fs.statSync(originFilename).size
    autoMkdirSync(path)

    const ext = getExt(originFilename)
    const metadata: FileMetadata = {
        ext,
        path,
        size,
        prefix,
        name: `${prefix}.${ext}`,
        filename: `${path}/${prefix}.${ext}`,
    }

    if (rename) await renameImage(originFilename, metadata.filename)
    else await copyImage(originFilename, metadata.filename)

    return metadata
}

export function removeFileSync(filename: string) {
    if (isFileSync(filename)) fs.rmSync(filename)
}

export function isFileSync(filename: string) {
    try {
        if (fs.statSync(filename).isFile()) return true
    } catch (err) {}
    return false
}

export function readDirSync(dir: string) {
    return fs.readdirSync(dir)
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

export async function clipImage(
    origin: string,
    target: string,
    maxWidth: number
) {
    const size = await getImageSize(origin)
    if (size.width < maxWidth) return false

    return new Promise((resolve: (d: true) => void, reject) => {
        gm(origin)
            .resize(maxWidth)
            .write(target, (err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
    })
}
