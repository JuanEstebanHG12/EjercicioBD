import { env } from "./env.js";

import pg from 'pg';

import { queryData, queryTables } from "../services/migrateService.js";

const { Pool } = pg;

export const pool = new Pool({
    connectionString: env.postgresUri
});

async function createTables() {
   try {
    await queryTables()
   } catch (error) {
    console.error(error);
   }
}

async function migrateData() {
    try {
        return await queryData()
    } catch (error) {
        console.error(error);
    }
}

export { createTables, migrateData }