import mongoose from "mongoose";

const academicHistorySchema = mongoose.Schema(
    {
        "courseCode": String,
        "courseName": String,
        "credits": Number,
        "semester": String,
        "professorName": String,
        "grade": Number,
        "status": String
    }, { _id: false }
)


const academicTranscriptsSchema = mongoose.Schema(
    {
        "studentEmail": String,
        "studentName": String,
        "academicHistory": [academicHistorySchema],
        "summary": {
            "totalCreditsEarned": Number,
            "averageGrade": Number
        }
    }, { _id: false }
)

export const AcademicTranscripts = mongoose.model(
    "academicTranscripts",
    academicTranscriptsSchema
)