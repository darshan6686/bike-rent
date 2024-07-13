import { Router } from "express";
import {
    changePassword,
    getAllOrders,
    login,
    logout,
    profile,
    refreshAccessToken,
    registerAdmin,
    updateAccountDetail
} from "../controllers/admin.controller.js";
import { verifyJWTAdmin } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(registerAdmin)
router.route("/login").post(login)

// secure route
router.route("/profile").get(verifyJWTAdmin, profile)
router.route("/logout").delete(verifyJWTAdmin, logout)
router.route("/update-account-details").patch(verifyJWTAdmin, updateAccountDetail)
router.route("/change-password").patch(verifyJWTAdmin, changePassword)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/orders").get(verifyJWTAdmin, getAllOrders)

export default router