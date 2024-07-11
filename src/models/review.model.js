import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        rating: {
            type: Number,
            min:0,
            max: 5,
            default: 0
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        bike: {
            type: Schema.Types.ObjectId,
            ref: "Bike"
        }
    },
    {
        timestamps: true
    }
)

export const Review = mongoose.model("Review", reviewSchema)