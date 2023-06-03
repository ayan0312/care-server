import fs from 'fs'
import gm from 'gm'
import path from 'path'
import got from 'got'
import { URL } from 'url'
import { pipeline } from 'stream'
import { IncomingMessage } from 'http'
import { fromStream } from 'file-type'
import { config, createStaticPaths } from './config'
import { forEachAsync } from './utilities'

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

function copyFileStream(oldPath: string, newPath: string) {
    let readStream = fs.createReadStream(oldPath)
    let writeStream = fs.createWriteStream(newPath)
    readStream.pipe(writeStream)
    return { readStream, writeStream }
}

function copyFile(oldPath: string, newPath: string): Promise<void> {
    const { readStream, writeStream } = copyFileStream(oldPath, newPath)
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

export function renameFile(oldPath: string, newPath: string): Promise<void> {
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
    targetPath: string,
    originFilename: string,
    rename?: boolean
) {
    let size = fs.statSync(originFilename).size
    autoMkdirSync(targetPath)

    const ext = getExt(originFilename)
    const metadata: FileMetadata = {
        ext,
        path: targetPath,
        size,
        prefix,
        name: `${prefix}.${ext}`,
        filename: `${targetPath}/${prefix}.${ext}`,
    }

    if (rename) await renameFile(originFilename, metadata.filename)
    else await copyFile(originFilename, metadata.filename)

    return metadata
}

export function rmSync(filename: string) {
    if (isFileSync(filename)) fs.rmSync(filename)
}

export function rmDirSync(path: string) {
    fs.rmdirSync(path)
}

export function isFileSync(filename: string) {
    try {
        if (fs.statSync(filename).isFile()) return true
    } catch (err) {}
    return false
}

export function readDirSync(dir: string) {
    return fs
        .readdirSync(dir)
        .filter((filename) => isFileSync(path.join(dir, filename)))
}

export function sortFilenames(filenames: string[]) {
    return filenames
        .map((filename) => ({
            base: filename
                .split('.')[0]
                .split('_')
                .map((num) => Number(num)),
            filename,
        }))
        .sort((a, b) => {
            const fn = (index: number): number => {
                if (a.base[index] == null && b.base[index] == null) return 0
                if (a.base[index] == null && b.base[index] != null)
                    return b.base[index]
                if (a.base[index] != null && b.base[index] == null)
                    return a.base[index]
                const result = a.base[index] - b.base[index]
                if (result === 0) return fn((index += 1))
                return result
            }
            return fn(0)
        })
        .map((result) => result.filename)
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

async function checkMaxSize(
    filename: string,
    maxWidth: number,
    maxHeight?: number
) {
    const size = await getImageSize(filename)
    if (size.width < maxWidth) return false
    if (maxHeight && size.height < maxHeight) return false
    return true
}

export async function clipImage(
    origin: string,
    target: string,
    maxWidth: number,
    maxHeight?: number
) {
    if (!(await checkMaxSize(origin, maxWidth, maxHeight))) return false
    return new Promise((resolve: (value: boolean) => void, reject) => {
        gm(origin)
            .resize(maxWidth, maxHeight)
            .write(target, (err) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(true)
            })
    })
}

function getAssetPath(filename: string) {
    return {
        origin: path.join(config.static.assets, filename),
        target: path.join(config.static.asset_thumbs, filename),
    }
}

export async function clipImageStream(
    origin: string,
    target: string,
    maxWidth: number,
    maxHeight?: number
) {
    if (!(await checkMaxSize(origin, maxWidth, maxHeight))) return null
    const readStream = fs.createReadStream(origin)
    const writeStream = fs.createWriteStream(target)
    gm(readStream).resize(maxWidth, maxHeight).stream().pipe(writeStream)
    return { readStream, writeStream }
}

export function getAssetThumbs(
    filename: string,
    createThumbStreamURL: (origin: string) => string
) {
    const { origin, target } = getAssetPath(filename)
    const relativePaths = createStaticPaths('/static/')

    if (isFileSync(origin)) {
        if (isFileSync(target)) return [relativePaths.asset_thumbs + filename]
        return [relativePaths.assets + filename]
    }

    // 1.jpg 2.gif 3.jpg
    const assetFilenames = sortFilenames(readDirSync(origin))
    // 1.jpg
    const thumbFilenames = sortFilenames(readDirSync(target))

    const arr: {
        asset: string
        thumb?: string
    }[] = []

    assetFilenames.forEach((assetFilename, index) => {
        arr[index] = {
            asset: `${filename}/${assetFilename}`,
        }
    })

    thumbFilenames.forEach((thumbFilename) => {
        const index = Number(getPrefix(thumbFilename)) - 1
        arr[index].thumb = `${filename}/${thumbFilename}`
    })

    return arr.map((item) => {
        if (item.thumb) return relativePaths.asset_thumbs + item.thumb
        if (!isClippableAsset(item.asset) || !createThumbStreamURL)
            return relativePaths.assets + item.asset
        return createThumbStreamURL(item.asset)
    })
}

export function getClippableContentType(filename: string) {
    switch (getExt(filename)) {
        case 'png':
            return 'image/png'
        case 'bmp':
            return 'image/bmp'
        case 'jpeg':
            return 'image/jpeg'
    }
    return ''
}

function isClippableAsset(filename: string) {
    switch (getExt(filename)) {
        case 'png':
        case 'bmp':
        case 'jpeg':
            return true
    }
    return false
}

export async function createAssetThumbStream(
    filename: string,
    maxWidth = config.thumb.maxWidth,
    maxHeight?: number
) {
    const { origin, target } = getAssetPath(filename)
    if (!isFileSync(origin) || !isClippableAsset(filename)) return
    const stream = await clipImageStream(origin, target, maxWidth, maxHeight)
    if (stream) return stream
    return copyFileStream(origin, target)
}

export async function createAssetThumb(
    filename: string,
    maxWidth = config.thumb.maxWidth,
    maxHeight?: number
) {
    const { origin, target } = getAssetPath(filename)
    if (!isFileSync(origin) || !isClippableAsset(filename)) return
    const clipped = await clipImage(origin, target, maxWidth, maxHeight)
    if (clipped) return
    await copyFile(origin, target)
}

export async function saveFiles(
    name: string,
    filenames: string[],
    root = config.static.assets,
    rename = true
) {
    const originalFilename = path.join(root, filenames[0])
    if (filenames.length === 1) {
        const metadata = await saveImage(
            name,
            config.static.assets,
            originalFilename,
            rename
        )
        await createAssetThumb(metadata.name)
        return metadata.name
    }

    const targetPath = path.join(config.static.assets, name)
    const metadata = await saveImage('1', targetPath, originalFilename, rename)
    autoMkdirSync(path.join(config.static.asset_thumbs, name))
    await createAssetThumb(path.join(name, metadata.name), 600)
    await forEachAsync(filenames.splice(1), async (filename, index) => {
        await saveImage(
            `${index + 2}`,
            targetPath,
            path.join(root, filename),
            rename
        )
    })
    return name
}

// TODO
export async function saveFolder(foldername: string) {
    return foldername
}
