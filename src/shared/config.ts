import path from 'path'

const STORAGE_PATH = 'C:/Users/ayan0312/Desktop/storage/'
// const STORAGE_PATH = 'C:/Spaces/Entertainments/Care/storage/'

export const config = {
    IP: '192.168.1.110',
    PORT: 3000,
    STORAGE_PATH,
    TEMP_PATH: path.resolve(STORAGE_PATH, 'temps'),
    BACKUPS_PATH: path.resolve(STORAGE_PATH, 'backups'),
    AVATARS_PATH: path.resolve(STORAGE_PATH, 'avatars'),
    ASSETS_PATH: path.resolve(STORAGE_PATH, 'assets'),
    DATABASE_FILENAME: path.resolve(STORAGE_PATH, 't.db'),
    FULL_LENGTH_PICTURES_PATH: path.resolve(STORAGE_PATH, 'fullLengthAssets'),
}
