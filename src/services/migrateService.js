import { pool } from "../config/postgres.js"
import fs from 'fs';
import csv from 'csv-parser';
import { env } from "../config/env.js";
import { AcademicTranscripts } from "../models/transcripts.js";

export async function queryTables() {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        //create table 
        await client.query(`
            CREATE TABLE IF NOT EXISTS "student" (
	"id" SERIAL NOT NULL UNIQUE,
	"name" VARCHAR(50) NOT NULL,
	"email" VARCHAR(50) NOT NULL UNIQUE,
	"phone" VARCHAR(15) NOT NULL,
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
	"enrolmment_id" VARCHAR(20) NOT NULL UNIQUE,
	"semester" VARCHAR(15) NOT NULL,
	"grade" DECIMAL(2,1) NOT NULL,
	"tuition_fee" INTEGER NOT NULL,
	"student_id" INTEGER NOT NULL,
	"course_code" VARCHAR(20) NOT NULL,
	PRIMARY KEY("enrolmment_id"),
    CONSTRAINT fk_student_id_student FOREIGN KEY("student_id") REFERENCES "student"("id")
    ON UPDATE NO ACTION ON DELETE NO ACTION,
    CONSTRAINT fk_course_code_course FOREIGN KEY("course_code") REFERENCES "course"("code")
ON UPDATE NO ACTION ON DELETE NO ACTION
);
    `)
        await client.query('COMMIT')
    } catch (error) {
        await client.query('ROLLBACK')
    } finally {
        client.release()
    }
}

export async function queryData() {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const result = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(env.fileDataCsv)
                .pipe(csv())
                .on("data", (data) => result.push(data))
                .on("end", resolve)
                .on("error", reject);
        });
        for (const row of result) {
            const studentName = row.student_name.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            const studentEmail = row.student_email.trim().toLowerCase();
            const studentPhone = row.student_phone.trim();
            const professorName = row.professor_name.trim();
            const professorEmail = row.professor_email.trim().toLowerCase();
            const department = row.department.trim();
            const courseCode = row.course_code.trim().toUpperCase();
            const courseName = row.course_name.trim();
            const credits = parseInt(row.credits);
            const semester = row.semester.trim();
            const grade = parseFloat(row.grade);
            const tuitionFee = parseInt(row.tuition_fee);
            const amountPaid = parseInt(row.amount_paid);

            await client.query(`
                INSERT INTO "student" ("name", "email", "phone") VALUES ($1, $2, $3) ON CONFLICT ("email")
                DO NOTHING
                `, [studentName, studentEmail, studentPhone])

            await client.query(`
                INSERT INTO "department" ("name") VALUES ($1) ON CONFLICT ("name")
                DO NOTHING
                `, [department])

            const departmentId = await client.query(`select id from department where name = $1`, [department])


            await client.query(`
                INSERT INTO "profesor" ("name", "email", "department_id") VALUES ($1, $2, $3) ON CONFLICT ("email")
                DO NOTHING
                `, [professorName, professorEmail, departmentId.rows[0].id])

            const profesorId = await client.query(`select id from profesor where email = $1`, [professorEmail])

            await client.query(`
                INSERT INTO "course" ("code", "name", "credits", "profesor_id") VALUES ($1, $2, $3, $4) ON CONFLICT ("code")
                DO NOTHING
                `, [courseCode, courseName, credits, profesorId.rows[0].id])


            const studentId = await client.query(`select id from student where email = $1`, [studentEmail.toLowerCase()])


            await client.query(`
                INSERT INTO "enrrollments" ("enrolmment_id", "semester", "grade", "tuition_fee", "student_id", "course_code") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT ("enrolmment_id")
                DO NOTHING
                `, [row.enrolmment_id, semester, grade, tuitionFee, studentId.rows[0].id, courseCode])



            await AcademicTranscripts.findOneAndUpdate(
                { "studentEmail": studentEmail },
                {
                    $setOnInsert: {
                        "studentEmail": studentEmail,
                        "studentName": studentName,
                        "summary": {
                            "totalCreditsEarned": 4,
                            "averageGrade": 4.5
                        },
                    },
                    $push: {
                        "academicHistory": {
                            "courseCode": courseCode,
                            "courseName": courseName,
                            "credits": credits,
                            "semester": semester,
                            "professorName": professorName,
                            "grade": grade,
                            "status": "Aprobado"
                        }
                    }


                },
                { upsert: true }
            )

            /*{ 
                "studentEmail": "j.perez@unigestion.edu",
                "studentName": "Juan Perez",
                "academicHistory": [
                    {
                        "courseCode": "CS101",
                        "courseName": "Introducción a la Programación",
                        "credits": 4,
                        "semester": "2023-1",
                        "professorName": "Dra. Ana Silva",
                        "grade": 4.5,
                        "status": "Aprobado"
                    }
                ],
                "summary": {
                    "totalCreditsEarned": 4,
                    "averageGrade": 4.5
                }
            } */
        }
        let totalCredits = await client.query(`
                    select Round(AVG(e.grade),1) as average_grade , s.email , sum(c.credits) as total_credits from student s 
join enrrollments e on s.id = e.student_id                      
join course c on e.course_code = c.code group by s.email  ;     
                    `)
        for (const student of totalCredits.rows) {

            await AcademicTranscripts.updateOne(
                { studentEmail: student.email },
                {
                    $set: {
                        "summary.totalCreditsEarned": parseInt(student.total_credits),
                        "summary.averageGrade": parseInt(student.average_grade)
                    }
                }
            );
        }

        await client.query('COMMIT')

    } catch (error) {
        console.log(error);
        await client.query('ROLLBACK')
    } finally {
        client.release()
    }
}