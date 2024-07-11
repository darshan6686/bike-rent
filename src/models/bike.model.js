import mongoose, { Schema } from "mongoose";

const bikeSchema = new Schema(
    {
        bikeName: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        deposite: {
            type: Number,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        stock: {
            type: Number,
            required: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "Admin"
        },
        policies: {
            type: String
        },
        verification: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

export const Bike = mongoose.model("Bike", bikeSchema)