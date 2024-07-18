import mongoose from "mongoose";
import { Bike } from "../models/bike.model.js";
import { Order } from "../models/order.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STIRPE_SCERET_KEY)


const createCheckoutSession = async(name, unit_amount, quantity) => {
    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: name
                        },
                        unit_amount: unit_amount
                    },
                    quantity: quantity
                }
            ],
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['IN']
            },
            success_url: `https://zeuxinnovation.com/wp-content/uploads/2023/04/maximising-user-satisfaction-4.jpg`,
            cancel_url: 'http://localhost:3000/cancel'
        })
        return session
    } catch (error) {
        throw new ApiError(400, "something wrong in payment")
    }
}


const addOrder = asyncHandler(async(req,res) => {
    const {bikeId} = req.params
    const {address, payment, quantity, month = 1} = req.body

    if (!bikeId) {
        throw new ApiError(400, "bikeId is missing")
    }

    if (!(address && payment && quantity)) {
        throw new ApiError(400, "All field is required")
    }

    const bike = await Bike.findById(
        bikeId
    )

    if (!bike) {
        throw new ApiError(400, "bike not found")
    }

    if (bike.stock < quantity) {
        throw new ApiError(400, "quantity is not available")
    }

    const price = bike.price * Number(quantity) * Number(month)
    const deposite = bike.deposite
    const total = price + deposite

    let paymentInfo
    if (payment == "CARD") {
        paymentInfo = await createCheckoutSession(bike.bikeName, total * 100, quantity)
    }

    const order = await Order.create({
        user: req.user._id,
        address,
        products: [
            {
                bikes: bikeId,
                quantity,
                month
            }
        ],
        price,
        deposite,
        total,
        saller: bike.owner,
        payment,
        status: "PROCESSING"
    })

    bike.stock = bike.stock - quantity
    await bike.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                order,
                paymentId: payment == "CARD" ? paymentInfo.url : null
            },
            "order placed successfully"
        )
    )
})


const cancelledOrder = asyncHandler(async(req,res) => {
    const {orderId} = req.params

    if (!orderId) {
        throw new ApiError(400, "orderId is missing")
    }

    const order = await Order.findById(
        orderId
    )

    if (!order) {
        throw new ApiError(400, "order not found")
    }

    if (order.status === "CANCELLED") {
        throw new ApiError(400, "order already cancelled")
    }
    order.status = "CANCELLED"
    await order.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            order,
            "order cancelled successfully"
        )
    )
})


const getOrder = asyncHandler(async(req,res) => {
    const order = await Order.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user?._id)
            }
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
                            _id: 1,
                            bikeName: 1,
                            image: 1,
                            category: 1,
                            price: 1,
                            deposite: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$products.bikes"
        },
        {
            $lookup: {
                from: "admins",
                localField: "saller",
                foreignField: "_id",
                as: "saller",
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
            $unwind: "$saller"
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
            order,
            "All order fetched successfully"
        )
    )
})


const getOrderById = asyncHandler(async(req,res) => {
    const {orderId} = req.params

    if (!orderId) {
        throw new ApiError(400, "orderId is missing")
    }

    const order = await Order.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(orderId)
            }
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
                            _id: 1,
                            bikeName: 1,
                            image: 1,
                            category: 1,
                            price: 1,
                            deposite: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$products.bikes"
        },
        {
            $lookup: {
                from: "admins",
                localField: "saller",
                foreignField: "_id",
                as: "saller",
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
            $unwind: "$saller"
        }
    ])

    if (!order.length) {
        throw new ApiError(400, "order not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            order,
            "order fetched successfully"
        )
    )
})


const deliveredOrder = asyncHandler(async(req,res) => {
    const {orderId} = req.params

    if (!orderId) {
        throw new ApiError(400, "orderId is missing")
    }

    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            status: "PROCESSING"
        },
        {
            $set: {
                status: "DELIVERED"
            }
        },
        {
            new: true
        }
    )
    if (!order) {
        throw new ApiError(400, "order not found or order has cancelled")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            order,
            "order delivered successfully"
        )
    )
})


export {
    addOrder,
    cancelledOrder,
    getOrder,
    getOrderById,
    deliveredOrder
}