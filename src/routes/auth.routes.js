import { Router } from "express";
import {
    changeCurrentPassword,
    forgotPasswordRequest,
    getCurrentUser,
    login,
    logoutUser,
    refreshAccessToken,
    registerUser,
    resendEmailVerification,
    resetForgotPassword,
    verifyEmail,
} from "../controllers/auth.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import {
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userLoginValidator,
    userRegisterValidator,
    userResetForgotPasswordValidator,
} from "../validators/index.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

// Unsecure routes - These don't require JWT tokens
router.route("/register").post(userRegisterValidator(), validate, registerUser); // registerUser will run only if validate return next()
// validate identifies errors on the basis of userRegisterValidator()

router.route("/login").post(userLoginValidator(), validate, login); // login will run only if validate return next()
router.route("/verify-email/:verificationToken").get(verifyEmail);
router.route("/refresh-token").post(refreshAccessToken);
router
    .route("/forgot-password")
    .post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router
    .route("/reset-password/:resetToken")
    .post(userResetForgotPasswordValidator(), validate, resetForgotPassword);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser); // logoutUser will run only if validate return next()
router.route("/current-user").post(verifyJWT, getCurrentUser); // In code tutorial its a POST request but in PRD its a GET request
router
    .route("/change-password")
    .post(
        verifyJWT,
        userChangeCurrentPasswordValidator(),
        validate,
        changeCurrentPassword,
    );
router
    .route("/resend-email-verification")
    .post(verifyJWT, resendEmailVerification);

export default router;
