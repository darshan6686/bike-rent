import { Admin } from "../models/admin.model.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";


const generateAccessTokenAndRefreshToken = async(adminId) => {
    try {
        const admin = await Admin.findById(adminId)
        const accessToken = await admin.generateAccessToken()
        const refershToken = await admin.generateRefreshToken()
        admin.refreshToken = refershToken
        await admin.save({ validateBeforeSave: false })

        return { accessToken, refershToken }
    } catch (error) {
        throw new ApiError(400, "unauthorized request")
    }
}


const registerAdmin = asyncHandler(async(req,res) => {
    const {name, email, address, phone, password} = req.body

    if (!(name || email || address || phone || password)) {
        throw new ApiError(400, "All field is required")
    }

    const existAdmin = await Admin.findOne({
        email
    })

    if (existAdmin) {
        throw new ApiError(400, "admin has already exists")
    }

    const admin = await Admin.create({
        name: name.toLowerCase(),
        email,
        address,
        phone,
        password
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            admin,
            "admin created successfully"
        )
    )
})


const login = asyncHandler(async(req,res) => {
    const {email, password} = req.body

    if (!(email || password)) {
        throw new ApiError(400, "email or password both are required")
    }

    const admin = await Admin.findOne({
        email
    })

    if (!admin) {
        throw new ApiError(400, "admin does not register")
    }

    const isValidPassword = await admin.isCorrectPassword(password)

    if (!isValidPassword) {
        throw new ApiError(400, "invalid password")
    }

    const { accessToken, refershToken} = await generateAccessTokenAndRefreshToken(admin._id)

    const loggedInAdmin = await Admin.findById(admin._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .cookie("adminAccessToken", accessToken, options)
    .cookie("adminRefreshToken", refershToken, options)
    .json(
        new ApiResponse(
            200,
            {
                admin: loggedInAdmin,
                accessToken,
                refershToken
            },
            "admin loggeIn successfully"
        )
    )
})


const logout = asyncHandler(async(req,res) => {
    const admin = await Admin.findByIdAndUpdate(
        req.admin?._id,
        {
            $unset: {
                refershToken: 1
            }
        },
        {
            new: true
        }
    ).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("adminAccessToken", options)
    .clearCookie("adminRefreshToken", options)
    .json(
        new ApiResponse(
            200,
            admin,
            "admin loggeOut successfully"
        )
    )
})


const profile = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.admin,
            "admin profile fteched successfully"
        )
    )
})


const refreshAccessToken = asyncHandler(async(req,res) => {
    const incommingRefreshToken = req.cookies.adminRefreshToken || req.body.adminRefreshToken
    
    if (!incommingRefreshToken) {
        throw new ApiError(400, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const admin = await Admin.findById(decodedToken?._id)

        if (!admin) {
            throw new ApiError(400, "Invalid token")
        }

        if (incommingRefreshToken !== admin.refreshToken) {
            throw new ApiError(400, "Invalid token or token used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const {accessToken, refershToken} = await generateAccessTokenAndRefreshToken(admin._id)

        return res
        .status(200)
        .cookie("adminAccessToken", accessToken, options)
        .cookie("adminRefreshToken", refershToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken: refershToken
                },
                "token refreshed successfully"
            )
        )
        
    } catch (error) {
        throw new ApiError(400, "Invalid refesh token")
    }
})


const updateAccountDetail = asyncHandler(async(req,res) => {
    const { name, email, address, phone } = req.body

    if (!(name || email || address || phone)) {
        throw new ApiError(400, "All field is required")
    }

    const admin = await Admin.findByIdAndUpdate(
        req.admin?._id,
        {
            $set: {
                name: name.toLowerCase(),
                email,
                address,
                phone
            }
        },
        {
            new: true
        }
    ).select(
        "-password -refreshToken"
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            admin,
            "Account detail updated successfully"
        )
    )
})


const changePassword = asyncHandler(async(req,res) => {
    const { oldPassword, newPassword } = req.body

    if (!(oldPassword && newPassword)) {
        throw new ApiError(400, "All field is required")
    }

    const admin = await Admin.findById(req.admin?._id)

    const isValidPassword = await admin.isCorrectPassword(oldPassword)

    if (!isValidPassword) {
        throw new ApiError(400, "Invalid password")
    }

    admin.password = newPassword
    await admin.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "password updated successfully"
        )
    )
})


const getAllOrders = asyncHandler(async(req,res) => {
    const orders = await Order.aggregate([
        {
            $match: {
                $nor: [{
                    status: "CANCELLED"
                }],
                saller: req.admin?._id
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            profileImage: 1
                        }   
                    }
                ]
            }
        },
        {
            $unwind: "$user"
        },
        {
            $lookup: {
                from: "bikes",
                localField: "products.bikes",
                foreignField: "_id",
                as: "products.bikes",
                pipeline: [
                    {
                        $project: {
                            bikeName: 1,
                            image: 1,
                            price: 1,
                            deposite: 1,
                            category: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$products.bikes"
        },
        {
            $sort: {
                updatedAt: -1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            orders,
            "All orders fetched successfully"
        )
    )
})


export{
    registerAdmin,
    login,
    logout,
    profile,
    refreshAccessToken,
    updateAccountDetail,
    changePassword,
    getAllOrders
}