import dotenv from "dotenv"
import connectDb from "./db/index.js"
import { app } from "./app.js"

dotenv.config({
    path: "./.env"
})

connectDb()
    .then(() => {
        app.on("error", (error) => {
            console.log("error", error);
            throw error
       })
       app.listen(process.env.PORT || 8000, () => {
            console.log(`\n Server started runnig on port : ${process.env.PORT}`);
       })
    })
    .catch((error) => {
        console.log("mongodb connection failed !!", error);
    })