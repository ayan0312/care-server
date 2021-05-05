import { autoMkdirSync } from "./image"

const STORAGE_PATH = 'C:/Users/ayan0312/Desktop/storage/'

export const config = {
    PORT: 3000,
    STORAGE_PATH,
    TEMP_PATH: STORAGE_PATH + 'temps',
    DATABASE_FILENAME: STORAGE_PATH + 't.db'
}

autoMkdirSync(config.STORAGE_PATH)
autoMkdirSync(config.TEMP_PATH)