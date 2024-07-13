import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    addOrder,
    cancelledOrder,
    deliveredOrder,
    getOrder,
    getOrderById
} from "../controllers/order.controller.js";

const router = Router()

router.use(verifyJWT)

router.route("/add-order/:bikeId").post(addOrder)
router.route("/orders").get(getOrder)
router.route("/order/:orderId").get(getOrderById)
router.route("/cancle-order/:orderId").delete(cancelledOrder)
router.route("/deliver-order/:orderId").patch(deliveredOrder)

export default router