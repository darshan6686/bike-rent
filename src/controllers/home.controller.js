import mongoose from "mongoose";
import { Bike } from "../models/bike.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const allBikes = asyncHandler(async(req,res) => {
    const {page = 1, limit = 10, sort = 1, sortBy = "createdAt" , userId} = req.query

    if (!userId) {
        throw new ApiError(400, "userId is missing")
    }

    const bikes = await Bike.aggregate([
        {
            $sort: {
                [sortBy]: sort == "1"? 1 : -1
            }
        },
        {
            $skip: parseInt(page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bikes,
            "All bike fetched successfully"
        )
    )
})


const bikeById = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    if (!bikeById) {
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

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bike,
            "bike fetched successfully"
        )
    )
})


const bikeByCategory = asyncHandler(async(req,res) => {
    const {page = 1, limit = 10, sort = 1, sortType = "createdAt"} = req.query
    const {category} = req.body

    if (!category) {
        throw new ApiError(400, "caregory is required")
    }

    const bikes = await Bike.aggregate([
        {
            $match: {
                category: category
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
        },
        {
            $sort: {
                [sortType]: sort == "1" ? 1 : -1
            }
        },
        {
            $skip: parseInt(page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bikes,
            "bike fetched successfullly"
        )
    )
})


const searchBike = asyncHandler(async(req,res) => {
    const {page = 1, limit = 10} = req.query
    const {search} = req.body

    if (!search) {
        throw new ApiError(400, "search field is required")
    }

    const bikes = await Bike.aggregate([
        {
            $match: {
                $or: [
                    {bikeName: {$regex: search, $options: "i"}},
                    {category: {$regex: search, $options: "i"}},
                    {price: {$regex: search, $options: "i"}},
                    {description: {$regex: search, $options: "i"}},
                ]
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
        },
        {
            $skip: parseInt(page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bikes,
            "bike serched successfully"
        )
    )
})


const sortBike = asyncHandler(async(req,res) => {
    const { sort = 1, page = 1, limit = 10 } = req.query

    const bikes = await Bike.aggregate([
        {
            $sort: {
                price: sort == "1"? 1 : -1
            }
        },
        {
            $skip: parseInt(page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bikes,
            "bike sorted successfullly"
        )
    )
})


const priceFilter = asyncHandler(async(req,res) => {
    const { page = 1, limit = 10, sortBy = 1 } = req.query
    const { minPrice, maxPrice } = req.body

    const bikes = await Bike.aggregate([
        {
            $match: {
                price: {
                    $gte: parseInt(minPrice),
                    $lte: parseInt(maxPrice)
                }
            }
        },
        {
            $skip: parseInt(page - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $sort: {
                price: sortBy == "1" ? 1 : -1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            bikes,
            "bikes fetched successfully"
        )
    )
})


export {
    allBikes,
    bikeById,
    bikeByCategory,
    searchBike,
    sortBike,
    priceFilter
}