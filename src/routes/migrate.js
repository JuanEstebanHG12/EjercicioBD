import { Router } from "express";
import { migrateData } from "../config/postgres.js";

const router = Router();

router.post('/migrate', async (req, res) =>{
    try {
        const counters = await migrateData()
        res.status(200).json(
            {
                message: 'Migration completed successfully',
                counters
        }
    )
    } catch (error) {
        
    }
})

export default router