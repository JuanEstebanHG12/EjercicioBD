import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const _dirname = dirname(fileURLToPath(import.meta.url))

config({ path: resolve(_dirname, '../../.env') });

const required = ["MONGO_URI", "POSTGRES_URI"];


for (const key of required) {
    if (!process.env[key]) {
        console.log(`Error: Missing required environment variable ${key}`);
        //throw error();
    }

}

export const env = {
    port: process.env.PORT ?? 3000,
    postgresUri: process.env.POSTGRES_URI,
    mongoUri: process.env.MONGO_URI,
    fileDataCsv: process.env.FILE_DATA_CSV ?? "./data/simulation_saludplus_data.csv"
}
