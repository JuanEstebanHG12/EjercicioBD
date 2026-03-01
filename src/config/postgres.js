import { env } from "./env.js";

import pg from 'pg';
import fs from 'fs';
import csv from 'csv-parser';

const { Pool } = pg;

const pool = new Pool({
    connectionString: env.postgresUri
});

async function createTables() {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        //create table 
        await client.query(`
            CREATE TABLE IF NOT EXISTS "student" (
	"id" SERIAL NOT NULL UNIQUE,
	"name" VARCHAR(50) NOT NULL,
	"email" VARCHAR(50) NOT NULL UNIQUE,
	"phone" VARCHAR(15) NOT NULL UNIQUE,
	PRIMARY KEY("id")
);
            `)

        //create table department
        await client.query(`
                CREATE TABLE IF NOT EXISTS "department" (
	"id" SERIAL NOT NULL UNIQUE,
	"name" VARCHAR(50) NOT NULL UNIQUE,
	PRIMARY KEY("id")
);
                `)

        //create table profesor
        await client.query(`
            
CREATE TABLE IF NOT EXISTS "profesor" (
	"id" SMALLSERIAL NOT NULL UNIQUE,
	"name" VARCHAR(50) NOT NULL,
	"email" VARCHAR(50) NOT NULL UNIQUE,
	"department_id" INTEGER,
	PRIMARY KEY("id"),
    CONSTRAINT fk_department_id_department FOREIGN KEY ("department_id")
        REFERENCES "department"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION
);
            `)

        //create table course
        await client.query(`
            
            
CREATE TABLE IF NOT EXISTS "course" (
	"code" VARCHAR(20) NOT NULL UNIQUE,
	"name" VARCHAR(50) NOT NULL UNIQUE,
	"credits" SMALLINT NOT NULL,
	"profesor_id" INTEGER,
	PRIMARY KEY("code"),

CONSTRAINT fk_profesor_id_profesor FOREIGN KEY ("profesor_id")
        REFERENCES "profesor"("id")
        ON UPDATE NO ACTION ON DELETE NO ACTION
        );
`)

        //create table enrrollments
        await client.query(`
    CREATE TABLE IF NOT EXISTS "enrrollments" (
	"id" SERIAL NOT NULL UNIQUE,
	"semester" VARCHAR(15) NOT NULL,
	"grade" DECIMAL(2,1) NOT NULL,
	"tuition_fee" INTEGER NOT NULL,
	"student_id" INTEGER NOT NULL,
	"course_code" VARCHAR(20) NOT NULL,
	PRIMARY KEY("id"),
    CONSTRAINT fk_student_id_student FOREIGN KEY("student_id") REFERENCES "student"("id")
    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_course_code_course FOREIGN KEY("course_code") REFERENCES "course"("code")
ON UPDATE NO ACTION ON DELETE NO ACTION
);
    `)
        await client.query('COMMIT')

    } catch (error) {
        console.error(error);
        await client.query('ROLLBACK')
    } finally {
        client.release()
    }
}

function initialdata(params) {

}

export { createTables, initialdata }