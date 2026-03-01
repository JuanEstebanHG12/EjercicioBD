import { Router } from "express";
import { getCourses, getCoursesByCode, updateCourseByCode } from "../services/coursesServices.js";

const router = Router();

router.get('/', async (req, res) => {
    try {
        const courses = await getCourses()
        res.status(200).json(
            {
                message: 'Courses get successfully',
                courses
            }
        )
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})


router.get('/:code', async (req, res) => {
    const { code } = req.params
    try {
        const course = await getCoursesByCode(code)
        if (!course) {
            return res.status(404).json({message : "Course not found"})
        }
        res.status(200).json(
            {
                message: 'Course get successfully',
                course
            }
        )
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

router.patch('/:code', async (req, res) =>{
    const { code } = req.params
    await updateCourseByCode(req.body, code)
    res.status(200).json({message: "Course updated"})
})

export default router