import mongoose from "mongoose";
import { Bike } from "../models/bike.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { removeOnCloudinary, uploadOnCloudinary } from "../utils/coudinary.js";


const addBike = asyncHandler(async(req,res) => {
    const {bikeName, category, price, deposite, description, stock, policies, verification} = req.body

    if (![bikeName, category, price, deposite, description, stock, policies, verification].some(details => {
        return details.trim()
    })) {
        throw new ApiError(400, "All field is required")
    }

    const imageLocalPath = req.files?.image[0]?.path

    if (!imageLocalPath) {
        throw new ApiError(400, "image is required")
    }

    const image = await uploadOnCloudinary(imageLocalPath)

    if (!image.url) {
        throw new ApiError(400, "image is required")
    }

    const bike = await Bike.create({
        bikeName,
        category,
        price,
        deposite,
        description,
        stock,
        policies,
        verification,
        image: image.url,
        owner: req.admin?._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bike,
            "bike added successfully"
        )
    )
})


const getBikeByAdmin = asyncHandler(async(req,res) => {
    const bikes = await Bike.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.admin?._id)
            }
        },
        {
            $lookup: {
                from: "admins",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            email: 1,
                            phone: 1,
                            address: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ])

    if (!bikes.length) {
        throw new ApiError(400, "admin cannot add any bikes")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bikes,
            "All bikes fetched suucessfully"
        )
    )
})


const getBikeById = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    if (!bikeId) {
        throw new ApiError(400, "bikeId is missing")
    }

    const bike = await Bike.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(bikeId)
            }
        },
        {
            $lookup: {
                from: "admins",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            phone: 1,
                            email: 1,
                            address: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$owner"
        }
    ])

    if (!bike.length) {
        throw new ApiError(400, "bike not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bike,
            "bike fetched suucessfully"
        )
    )
})


const updateBikeDetails = asyncHandler(async(req,res) => {
    const {bikeId} = req.params
    const {bikeName, category, price, deposite, description, policies, verification} = req.body

    if (![bikeName, category, price, deposite, description, stock, policies, verification].some( details => {
        return details.trim()
    })) {
        throw new ApiError(400, "All field is required")
    }

    const bike = await Bike.findByIdAndUpdate(
        bikeId,
        {
            $set: {
                bikeName,
                category,
                price,
                deposite,
                description,
                policies,
                verification
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
            bike,
            "bike updated successfully"
        )
    )
})


const deleteBike = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    if (!bikeId) {
        throw new ApiError(400, "bikeId is missing")
    }

    const bike = await Bike.findByIdAndDelete(
        bikeId
    )

    if (!bike) {
        throw new ApiError(400, "bike not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bike,
            "bike deleted successfully"
        )
    )
})


const updateBikeImage = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    const bike = await Bike.findById(
        bikeId
    )

    if (!bike) {
        throw new ApiError(400, "bike not found")
    }

    const url = bike.image.split("/")
    const filename = url[url.length - 1]
    const publicId = filename.split(".")[0]

    const removeImage = await removeOnCloudinary(publicId)

    const imageLocalPath = req.file?.path

    if (!imageLocalPath) {
        throw new ApiError(400, "image is required")
    }

    const image = await uploadOnCloudinary(imageLocalPath)

    if (!image.url) {
        throw new ApiError(400, "image is required")
    }

    const updatedBike = await Bike.findByIdAndUpdate(
        bikeId,
        {
            $set: {
                image: image.url
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
            updatedBike,
            "bike image updated successfully"
        )
    )
})


const updateBikeStock = asyncHandler(async(req,res) => {
    const {bikeId} = req.params
    const {stock} = req.body

    if (!stock) {
        throw new ApiError(400, "Stock field is required")
    }

    const bike = await Bike.findByIdAndUpdate(
        bikeId,
        {
            $inc: {
                stock: stock
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
            bike,
            "bike stock added successfully"
        )
    )
})


export {
    addBike,
    getBikeByAdmin,
    getBikeById,
    updateBikeDetails,
    deleteBike,
    updateBikeImage,
    updateBikeStock
}