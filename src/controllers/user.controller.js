import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeOnCloudinary, uploadOnCloudinary } from "../utils/coudinary.js";


const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
    
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(400, "something went to wrong genrate accessToken and refreshToken")
    }
}


const registerUser = asyncHandler(async(req,res) => {
    const {username,email,password} = req.body;

    if (!(username || email || password)) {
        throw new ApiError(411, "All field is required")
    }

    const existUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existUser) {
        throw new ApiError(409, "email or username has already exist")
    }

    const localProfileImagePath = req.files?.profileImage[0]?.path
    // console.log(localProfileImagePath);

    if (!localProfileImagePath) {
        throw new ApiError(400, "profile image is required")
    }

    const profileImage = await uploadOnCloudinary(localProfileImagePath)
    // console.log(profileImage);

    if (!profileImage) {
        throw new ApiError(409, "profile image is required")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email: email,
        password,
        profileImage: profileImage.url
    })

    const createUser = await User.findById(user?._id).select(
        "-password -refreshToken"
    )

    if (!createUser) {
        throw new ApiError(500, "something went to wrong when user register")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            createUser,
            "user registered successfully"
        )
    )
})


const login = asyncHandler(async(req,res) => {
    const {username, email, password} = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(400, "user does not exists")
    }

    const isValidPassword = await user.isPasswordCorrect(password)

    if (!isValidPassword) {
        throw new ApiError(400, "Invalid password")
    }

    const {accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "user logined in successfully"
        )
    )
})


const logout = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(
            200,
            {},
            "user logout successfully"
        )
    )
})


const profile = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            req.user,
            "user profile fetched successfully"
        )
    )
})


const refreshAccessToken = asyncHandler(async(req,res) => {
    const incomminRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!refreshAccessToken) {
        throw new ApiError(400, "unauthorization request")
    }

    try {
        const decodedToken = jwt.verify(
            incomminRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(400, "Invalid refresh token")
        }

        if (incomminRefreshToken !== user.refreshToken) {
            throw new ApiError(400, "refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken} = await generateAccessTokenAndRefreshToken(user._id)
        
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { 
                    accessToken,
                    refreshToken
                },
                "accessToken refresh successfully"
            )
        )

    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid refresh token")
    }
})


const updateAccountDetail = asyncHandler(async(req,res) => {
    const {username, email} = req.body

    if (!(username)) {
        throw new ApiError(400, "all field is required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                username: username.toLowerCase(),
                email
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "user deatils updated successfully"
        )
    )
})


const updateCurrentPassword = asyncHandler(async(req,res) => {
    const {oldPassword, newPassword} = req.body

    if (!(oldPassword || newPassword)) {
        throw new ApiError(400, "All field is required")
    }

    const user = await User.findById(req.user?._id)

    const isValidPassword = await user.isPasswordCorrect(oldPassword)

    if (!isValidPassword) {
        throw new ApiError(400, "Invalid password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false})

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


const updateProfileImage = asyncHandler(async(req,res) => {
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(400, "user not found")
    }

    const oldProfileImagePath = user.profileImage.split("/")
    const oldProfileImageName = oldProfileImagePath[oldProfileImagePath.length - 1]
    const publicId = oldProfileImageName.split(".")[0]
    // console.log(publicId);

    await removeOnCloudinary(publicId)

    const profileImageLocalPath = req.file?.path

    if (!profileImageLocalPath) {
        throw new ApiError(400, "profile image is required")
    }

    const profileImage = await uploadOnCloudinary(profileImageLocalPath)

    if (!profileImage) {
        throw new ApiError(400, "profile image not uploaded")
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                profileImage:  profileImage.url
            }
        },
        {
            new: true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedUser,
            "user profile image has updated successfully"
        )
    )
})


export {
    registerUser,
    login,
    logout,
    profile,
    refreshAccessToken,
    updateAccountDetail,
    updateCurrentPassword,
    updateProfileImage
}