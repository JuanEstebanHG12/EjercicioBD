import mongoose from "mongoose";
import { env } from "./env.js";


export const connectMongoDB = async () => {
    try {
        await mongoose.connect(env.mongoUri);
        console.log("MongoDB connected");
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}