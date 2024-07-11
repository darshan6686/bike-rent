import mongoose, { Schema } from "mongoose";

const wishlistSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        bikes: [{
            type: Schema.Types.ObjectId,
            ref: "Bike"
        }]
    },
    {
        timestamps: true
    }
)

export const Wishlist = mongoose.model("Wishlist", wishlistSchema)