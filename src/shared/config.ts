import { autoMkdirSync } from './image'

const STORAGE_PATH = 'C:/Users/ayan0312/Desktop/storage/'

export const config = {
    PORT: 3000,
    STORAGE_PATH,
    TEMP_PATH: STORAGE_PATH + 'temps',
    AVATARS_PATH: STORAGE_PATH + 'avatars',
    PICTURES_PATH: STORAGE_PATH + 'pictures',
    DATABASE_FILENAME: STORAGE_PATH + 't.db',
    FULL_LENGTH_PICTURES_PATH: STORAGE_PATH + 'fullLengthPictures',
}

autoMkdirSync(config.STORAGE_PATH)
autoMkdirSync(config.TEMP_PATH)
autoMkdirSync(config.AVATARS_PATH)
autoMkdirSync(config.AVATARS_PATH + '/200')
autoMkdirSync(config.PICTURES_PATH)
autoMkdirSync(config.PICTURES_PATH + '/300')
autoMkdirSync(config.FULL_LENGTH_PICTURES_PATH)
autoMkdirSync(config.FULL_LENGTH_PICTURES_PATH + '/300')
