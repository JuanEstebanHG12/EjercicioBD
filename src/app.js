import express from "express";
import migrateRouter from "./routes/migrate.js";
import coursesRouter from "./routes/courses.js";

export const app = express();

app.use(express.json())

app.use('/api/simulacro', migrateRouter )
app.use('/api/courses', coursesRouter)