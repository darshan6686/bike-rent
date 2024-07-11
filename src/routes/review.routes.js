import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    addReview,
    deleteReview,
    getReviews
} from "../controllers/review.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/add-review/:bikeId").post(addReview)
router.route("/reviews/:bikeId").get(getReviews)
router.route("/delete-review/:reviewId").delete(deleteReview)

export default router