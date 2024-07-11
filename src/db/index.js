import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDb = async() => {
    try {
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n MongoDB connected !! --Host: ${connection.connection.host}`)
    } catch (error) {
        console.log("mongodb connection failed", error);
        process.exit(1)
    }
}

export default connectDb