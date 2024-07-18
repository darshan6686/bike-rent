import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
    )
    
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

    
import userRoute from "./routes/user.routes.js"
import homeRoute from "./routes/home.routes.js"
import cartRoute from "./routes/cart.routes.js"
import whishlistRoute from "./routes/wishlist.routes.js"
import reviewRoute from "./routes/review.routes.js"
import orderRoute from "./routes/order.routes.js"

// user routes
app.use("/api/v1/users", userRoute)
app.use("/api/v1/home", homeRoute)
app.use("/api/v1/cart", cartRoute)
app.use("/api/v1/wishlist", whishlistRoute)
app.use("/api/v1/review", reviewRoute)
app.use("/api/v1/order", orderRoute)


import adminRoute from "./routes/admin.routes.js"
import bikeRoute from "./routes/bike.routes.js"
import adminDashboardRoute from "./routes/admin.dashboard.routes.js"

// admin routes
app.use("/api/v1/admin", adminRoute)
app.use("/api/v1/bikes", bikeRoute)
app.use("/api/v1/dashboard", adminDashboardRoute)

export { app }