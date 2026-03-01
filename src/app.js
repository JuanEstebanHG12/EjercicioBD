import express from "express";

export const app = express();

app.use(express.json())

app.post('/api/simulacro/migrate', (req, res) =>{
    
})