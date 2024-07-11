import mongoose, { Schema } from "mongoose";

const cartSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        bike: [
            {
                bike: {
                    type: Schema.Types.ObjectId,
                    ref: "Bike"
                },
                quantity: {
                    type: Number,
                    default: 1
                }
            }
        ],
        price: {
            type: Number,
            required: true
        },
        deposite: {
            type: Number,
            required: true
        },
        total: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
)

export const Cart = mongoose.model("Cart", cartSchema)