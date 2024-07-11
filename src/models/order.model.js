import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        address: {
            type: String
        },
        products: [
            {
                bikes: {
                    type: Schema.Types.ObjectId,
                    ref: "Bike"
                },
                quantity: {
                    type: Number,
                    default: 1
                },
                month: {
                    type: Number,
                    default: 1
                }
            }
        ],
        price: {
            type: Number
        },
        deposite: {
            type: Number
        },
        total: {
            type: Number
        },
        saller: {
            type: Schema.Types.ObjectId,
            ref: "Admin"
        },
        payment: {
            type: String,
            enum: ["COD", "UPI", "CARD"],
            default: "COD"
        },
        status: {
            type: String,
            enum: ["PENDING", "PROCESSING", "DELIVERED", "CANCELLED"],
            default: "PENDING"
        }    
    },
    {
        timestamps: true
    }
)

export const Order = mongoose.model("Order", orderSchema)