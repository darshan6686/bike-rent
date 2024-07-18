import { Router } from "express";
import { verifyJWTAdmin } from "../middleware/auth.middleware.js";
import {
    bikeInWork,
    dailyTotal,
    getAllOrders,
    growth,
    totalCustomer
} from "../controllers/admin.dashboard.controller.js";

const router = Router()

router.use(verifyJWTAdmin)

router.route("/orders").get(getAllOrders)
router.route("/customer").get(totalCustomer)
router.route("/growth").get(growth)
router.route("/daily").get(dailyTotal)
router.route("/bike-in-work").get(bikeInWork)

export default router