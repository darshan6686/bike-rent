import mongoose from "mongoose";
import { Bike } from "../models/bike.model.js";
import { Cart } from "../models/cart.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const addToCart = asyncHandler(async(req,res) => {
    const {bikeId} = req.params
    const {quantity = 1} = req.body

    const bike = await Bike.findById(
        bikeId
    )

    if (!bike) {
        throw new ApiError(400, "bike not found")
    }

    if (bike.stock < quantity) {
        throw new ApiError(400, "bike is out of stock")
    }
    
    const price = bike.price * Number(quantity)
    const deposite = bike.deposite
    const total = price + deposite

    const existCart = await Cart.findOne({
        user: req.user?.id
    })

    let cart
    if (!existCart) {
        cart = await Cart.create({
            user: req.user?.id,
            bike: [{
                bike: bikeId,
                quantity
            }],
            price,
            deposite,
            total
        })
    }
    else {
        cart = await Cart.findOneAndUpdate(
            {
                user: req.user?.id
            },
            {
                $push: {
                    bike: [{
                        bike: bikeId,
                        quantity
                    }],
                },
                $inc: {
                    price: price,
                    deposite: deposite,
                    total: total
                }
            },
            {
                new: true
            }
        )
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            cart,
            "Cart added successfully"
        )
    )
})


const getCart = asyncHandler(async (req, res) => {
    const cart = await Cart.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "bikes",
                localField: "bike.bike",
                foreignField: "_id",
                as: "bikeDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
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
            $unwind: "$bikeDetails"
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userDetails",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $group: {
                _id: "$_id",
                user: { $first: "$userDetails" },
                bikes: {
                    $push: {
                        bike: "$bikeDetails",
                        quantity: { $first: "$bike.quantity"}
                    }
                },
                price: { $first: "$price" },
                deposite: { $first: "$deposite" },
                total: { $first: "$total" },
                createdAt: { $first: "$createdAt" },
                updatedAt: { $first: "$updatedAt" }
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                cart,
                "cart fetched successfully"
            )
        );
})


const incrementQuantity = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    const bike = await Bike.findById(
        bikeId
    )

    if (!bikeId) {
        throw new ApiError(400, "bike not found")
    }

    const price = bike.price

    let cart = await Cart.findOne({
        user: req.user?._id,
        "bike.bike": bikeId
    })

    if (cart) {
        cart = await Cart.findOneAndUpdate(
            {
                user: req.user?._id,
                "bike.bike": bikeId
            },
            {
                $inc: {
                    "bike.$.quantity": 1,
                    price,
                    total: price
                }
            },
            {
                new: true
            }
        )
    } else {
        cart = await Cart.findOneAndUpdate(
            {
                user: req.user?._id
            },
            {
                $push: {
                    bike: {
                        bike: bikeId,
                        quantity: 1
                    }
                },
                $inc: {
                    price,
                    total: price
                }
            },
            {
                new: true
            }
        )
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            cart,
            "quantity increment successfully"
        )
    )
})


const decrementQuantity = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    const bike = await Bike.findById(
        bikeId
    )

    if (!bikeId) {
        throw new ApiError(400, "bike not found")
    }

    const price = bike.price

    let cart = await Cart.findOne({
        user: req.user?._id,
        "bike.bike": bikeId
    })

    if (!cart) {
        throw new ApiError(400, "cart not found")
    }

    const bikeInCart = await cart.bike.find(b => b.bike.toString() === bikeId)

    if (bikeInCart) {
        if (bikeInCart.quantity > 1) {
            cart = await Cart.findOneAndUpdate(
                {
                    user: req.user?._id,
                    "bike.bike": bikeId
                },
                {
                    $inc: {
                        "bike.$.quantity": -1,
                        price: -price,
                        total: -price
                    }
                },
                {
                    new: true
                }
            )
        }
        else {
            cart = await Cart.findOneAndUpdate(
                {
                    user: req.user?._id,
                    "bike.bike": bikeId
                },
                {
                    $pull: {
                       bike: { 
                            bike: bikeId
                       }
                    },
                    $inc: {
                        price: -price,
                        total: -price + -bike.deposite,
                        deposite: -bike.deposite
                    }
                },
                {
                    new: true
                }
            )
        }
    }
    else {
        throw new ApiError(400, "bike in not cart")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            cart,
            "quantity increment successfully"
        )
    )
})


const deleteBikeInCart = asyncHandler(async(req,res) => {
    const {bikeId} = req.params

    const bike = await Bike.findById(bikeId)

    if(!bike) {
        throw new ApiError(404, "bike not found")
    }

    const cart = await Cart.findOneAndUpdate(
        {
            user: req.user?._id,
            "bike.bike": bikeId
        },
        {
            $pull: {
               bike: { 
                    bike: bikeId
               }
            },
            $inc: {
                price: -bike.price,
                total: -bike.price + -bike.deposite,
                deposite: -bike.deposite
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
            cart,
            "bike removed in cart"
        )
    )
})


export {
    addToCart,
    getCart,
    incrementQuantity,
    decrementQuantity,
    deleteBikeInCart
}