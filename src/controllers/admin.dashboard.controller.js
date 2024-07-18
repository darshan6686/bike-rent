import { Order } from "../models/order.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const sumOfTotal = async(adminId, startDate, endDate = startDate) => {
    const total = await Order.aggregate([
        {
            $match: {
                saller: adminId,
                status: "DELIVERED",
                createdAt: {
                    $gte: startDate,
                    $lt: endDate
                }
            }
        },
        {
            $group: {
                _id: null,
                total: {
                    $sum: "$total"
                }
            }
        }
    ])

    return total[0]?.total || 0;
}


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
            $addFields: {
                bikeInWork: "$products.quantity"
            }
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


const totalCustomer = asyncHandler(async(req,res) => {
    const numberOfCustomer = await Order.find({
        saller: req.admin._id,
        status: "DELIVERED"
    }).countDocuments()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            numberOfCustomer,
            "Total customer fetched successfully"
        )
    )
})


const growth = asyncHandler(async(req,res) => {
    const currentDate = new Date()
    const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()))
    const endOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7))
    const startOfLastWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() - 7))
    const endOfLastWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7))
    
    const thisWeekTotal = await sumOfTotal(req.admin?._id, startOfWeek, endOfWeek)
    // console.log(thisWeekTotal);

    const lastWeekTotal = await sumOfTotal(req.admin?._id, startOfLastWeek, endOfLastWeek)
    // console.log(lastWeekTotal);

    const totalGrowth = Math.round(thisWeekTotal / lastWeekTotal * 100)

    // console.log(totalGrowth);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                growth: totalGrowth
            },
            "growth fetched successfully"
        )
    )
})


const dailyTotal = asyncHandler(async(req,res) => {
    const today = new Date();  
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(today.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    
    const total = await sumOfTotal(req.admin?._id, today, tomorrow)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            total,
            "daily total fetched successfully"
        )
    )
})


const bikeInWork = asyncHandler(async(req,res) => {
    const workingBike = await Order.aggregate([
        {
            $match: {
                status: "DELIVERED",
                saller: req.admin?._id
            }
        },
        {
            $unwind: "$products"
        },
        {
            $group: {
                _id: null,
                bikeInWork: {$sum: "$products.quantity"}
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            workingBike,
            "working bike fetched succesfully"
        )
    )
})


export {
    getAllOrders,
    totalCustomer,
    growth,
    dailyTotal,
    bikeInWork
}