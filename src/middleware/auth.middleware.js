import jwi from "jsonwebtoken"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Admin } from "../models/admin.model.js"

const verifyJWT = asyncHandler(async (req,res,next) => {
    try {
        const token = req.cookies?.accessToken || req.headers["Authorization"]?.replace("Bearer ", "")
    
        if (!token) {
            throw new ApiError(401, "unauthorized request")
        }
    
        const decodedToken = jwi.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )
        
        if (!user) {
            throw new ApiError(400, "Invalid user access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid user access token")
    }
})


const verifyJWTAdmin = asyncHandler(async(req,res,next) => {
    try {
        const token = req.cookies?.adminAccessToken || req.headers[ "Authorization" ]?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(400, "unauthorized request")
        }

        const decodedToken = jwi.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const admin = await Admin.findById(decodedToken?._id).select(
            "-password -refreshToken"
        )

        if (!admin) {
            throw new ApiError(400, "Invalid admin access token")
        }

        req.admin = admin
        next()
    } catch (error) {
        throw new ApiError(401, "Invalid admin access token")
    }
})

export {
    verifyJWT,
    verifyJWTAdmin
}