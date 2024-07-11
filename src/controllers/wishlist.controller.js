import { Bike } from "../models/bike.model.js";
import { Wishlist } from "../models/wishlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addToWishllist = asyncHandler(async(req,res) => {
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

    const existsWishlist = await Wishlist.findOne({
        user: req.user?._id
    })

    let wishlist

    if (existsWishlist) {
        wishlist = await Wishlist.findOneAndUpdate(
            {
                user: req.user?._id
            },
            {
                $push: {
                    bikes: bikeId
                }
            },
            {
                new: true
            }
        )
    } else {
        wishlist = await Wishlist.create({
            user: req.user?._id,
            bikes: bikeId
        })
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            wishlist,
            "bike added in wishlist successfully"
        )
    )
})


const getWishlist = asyncHandler(async(req,res) => {
    const wishlist = await Wishlist.aggregate([
        {
            $match: {
                user: req.user?._id
            }
        },
        {
            $lookup: {
                from: "bikes",
                localField: "bikes",
                foreignField: "_id",
                as: "bikes",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            bikeName: 1,
                            price: 1,
                            image: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$bikes"
        },
        {
            $group: {
                _id: "$user",
                bikes: {
                    $push: "$bikes"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            wishlist,
            "bike fetched successfully in wishlist"
        )
    )
})


const removeWishlist = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    if (!bikeId) {
        throw new ApiError(400, "wishlistId is missing")
    }

    const wishlist = await Wishlist.findOneAndUpdate(
        {
            user: req.user?._id
        },
        {
            $pull: {
                bikes: bikeId
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
            wishlist,
            "bike removed from wishlist"
        )
    )
})


export {
    addToWishllist,
    getWishlist,
    removeWishlist
}