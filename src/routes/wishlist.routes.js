import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    addToWishllist,
    getWishlist,
    removeWishlist
} from "../controllers/wishlist.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/add-bike-wishlist/:bikeId").post(addToWishllist)
router.route("/wishlists").get(getWishlist)
router.route("/remove-bike-wishlist/:bikeId").delete(removeWishlist)

export default router