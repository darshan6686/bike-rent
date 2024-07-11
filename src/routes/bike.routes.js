import { Router } from "express";
import { verifyJWTAdmin } from "../middleware/auth.middleware.js";
import {
    addBike,
    deleteBike,
    getBikeByAdmin,
    getBikeById,
    updateBikeDetails,
    updateBikeImage
} from "../controllers/bike.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWTAdmin)

router.route("/add-bike").post(
    upload.fields([
        {
            name: "image",
            maxCount: 1
        }
    ]),
    addBike
)
router.route("/bikes").get(getBikeByAdmin)
router.route("/bike/:bikeId").get(getBikeById)
router.route("/update-bike/:bikeId").patch(updateBikeDetails)
router.route("/delete-bike/:bikeId").delete(deleteBike)
router.route("/update-image/:bikeId").patch(
    upload.single("image"),
    updateBikeImage
)

export default router