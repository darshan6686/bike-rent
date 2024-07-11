import { Router } from "express";
import {
    login,
    logout,
    profile,
    refreshAccessToken,
    registerUser,
    updateAccountDetail,
    updateCurrentPassword,
    updateProfileImage
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import {verifyJWT} from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register")
    .post(
        upload.fields([
            {
                name: "profileImage",
                maxCount: 1
            }
        ]),
        registerUser
    )

router.route("/login").post(login)


// secure route
router.route("/logout").delete(verifyJWT, logout)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/profile").get(verifyJWT, profile)
router.route("/update-password").patch(verifyJWT, updateCurrentPassword)
router.route("/update-account-details").patch(verifyJWT, updateAccountDetail)
router.route("/update-profile-image")
    .patch(
        verifyJWT,
        upload.single("profileImage"),
        updateProfileImage
    )

export default router