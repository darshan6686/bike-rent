import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    addToCart,
    decrementQuantity,
    deleteBikeInCart,
    getCart,
    incrementQuantity
} from "../controllers/cart.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/add-cart/:bikeId").post(addToCart)
router.route("/carts").get(getCart)
router.route("/increase-quantity/:bikeId").patch(incrementQuantity)
router.route("/decrease-quantity/:bikeId").patch(decrementQuantity)
router.route("/remove-bike/:bikeId").delete(deleteBikeInCart)

export default router