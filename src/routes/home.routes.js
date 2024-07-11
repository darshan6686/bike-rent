import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    allBikes,
    bikeByCategory,
    bikeById,
    priceFilter,
    searchBike,
    sortBike
} from "../controllers/home.controller.js";

const router = Router();

router.use(verifyJWT)

router.route("/bikes").get(allBikes)
router.route("/bike/:bikeId").get(bikeById)
router.route("/category").get(bikeByCategory)
router.route("/search-bike").get(searchBike)
router.route("/filter-bike").get(sortBike)
router.route("/filter-price").get(priceFilter)

export default router