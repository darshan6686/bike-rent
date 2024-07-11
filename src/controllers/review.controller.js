import mongoose from "mongoose";
import { Bike } from "../models/bike.model.js";
import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addReview = asyncHandler(async(req,res) => {
    const {bikeId} = req.params
    const {content, rating} = req.body

    if (!bikeId) {
        throw new ApiError(400, "bikeId is missing")
    }

    if (!content) {
        throw new ApiError(400, "content is required")
    }

    const bike = await Bike.findById(
        bikeId
    )

    if (!bike) {
        throw new ApiError(400, "bike not found")
    }

    const review = await Review.create({
        content,
        rating,
        bike: bikeId,
        user: req.user.id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            review,
            "review added successfully in bike"
        )
    )
})


const getReviews = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    if (!bikeId) {
        throw new ApiError(400, "bikeId is missing")
    }

    const bike = await Bike.findById(
        bikeId
    )

    if (!bike) {
        throw new ApiError(400, "bike not found")
    }

    const review = await Review.aggregate([
        {
            $match: {
                bike: new mongoose.Types.ObjectId(bikeId)
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
                            _id: 1,
                            username: 1,
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
            $sort: {
                createdAt: -1
            }
        }
    ])

    const averageRating = await Review.aggregate([
        {
            $match: {
                bike: new mongoose.Types.ObjectId(bikeId)
            }
        },
        {
            $group: {
                _id: null,
                averageRating: {
                    $avg: "$rating"
                }
            }
        }
    ])

    const countReview = await Review.find({
        bike: new mongoose.Types.ObjectId(bikeId)
    }).count()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                countReview,
                averageRating: averageRating[0].averageRating,
                review,
            },
            "review fetched successfully"
        )
    )
})


const deleteReview = asyncHandler(async(req,res) => {
    const { reviewId } = req.params

    if (!reviewId) {
        throw new ApiError(400, "reviewId is missing")
    }

    const review = await Review.findByIdAndDelete(
        reviewId
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            review,
            "review deleted successfully"
        )
    )
})


export {
    addReview,
    getReviews,
    deleteReview
}