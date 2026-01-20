import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
    emailVerificationMailGenContent,
    forgotPasswordMailGenContent,
    sendEmail,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating access token",
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role } = req.body;

    const existingUser = await User.findOne({
        $or: [{ username, email }], // '$or' used to search by either using username OR email
    });

    if (existingUser) {
        throw new ApiError(
            409,
            "User with given email or username already exists.",
            [],
        );
    }

    const user = await User.create({
        email,
        password,
        username,
        isEmailVerified: false,
    });

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailGenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user.",
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                200,
                { user: createdUser },
                "User registered successfully and verification email has been sent on your email.",
            ),
        );
});

const login = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body;

    // Verification based on username and email
    // if (!username && !email){
    //     throw new ApiError(400, "Username and email ID is required.")
    // }

    if (!email) {
        throw new ApiError(400, "Email ID is required.");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, "User does not exist.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid password.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id,
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry", // '-' followed by a field ensure that field is not sent in loggedInUser variable
    );

    // ------------CODE FOR COOKIE CONFIGURATION-------------------------------------------------------------------------------------------------------------------
    // options is just a plain JS object that configures how the cookies are set on the response
    const options = {
        httpOnly: true, // httpOnly: true → browser JavaScript cannot read these cookies (they are not accessible via document.cookie), which helps protect tokens from XSS attacks.

        secure: true, // secure: true → cookies are only sent over HTTPS, never plain HTTP
    };
    // ------------CODE FOR COOKIE CONFIGURATION-------------------------------------------------------------------------------------------------------------------

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged in successfully.",
            ),
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: "",
            },
        },

        // new: true is Mongoose’s option (not raw MongoDB syntax) that controls what the method returns.
        // By default, findByIdAndUpdate returns the old document (before update).
        // With { new: true }, it returns the updated document (after update).
        {
            new: true,
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));

    /* --------IMPORTANT NOTES---------------------------------------------------------------------------------------------------------------
1. clearCookie(name, options) tells the browser “delete this cookie”.
    It does this by sending a Set-Cookie header with the same name (and matching options like httpOnly, secure, path) but with an expiry in the past.
    Browser receives the response and removes that cookie from storage.

2. User.findByIdAndUpdate()
    This is a Mongoose model method that combines “find document by _id” + “update it”.
    
    id: which document (user) to target.
    updateObject: what changes to apply.
    options: extra behavior (like new: true).

3. What $set does (MongoDB)?
    MongoDB update operators like $set describe how to modify fields, not replace the whole document.    

4. What new: true does ?
    new: true is Mongoose’s option (not raw MongoDB syntax) that controls what the method returns.
    By default, findByIdAndUpdate returns the old document (before update).
    With { new: true }, it returns the updated document (after update).
------------IMPORTANT NOTES---------------------------------------------------------------------------------------------------------------
*/
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully.",
            ),
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;
    // req.params is used to access the url
    // req.params will be { verificationToken: "abc123" }

    if (!verificationToken) {
        throw new ApiError(400, "Email verification is missing.");
    }

    let hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    }); // 2 conditions are passed in findOne()

    if (!user) {
        throw new ApiError(400, "Token is either invalid or expired");
    }

    user.emailVerificationToken = undefined; // After verification, data stored in emailVerificationToken and emailVerificationToken is
    user.emailVerificationToken = undefined; // unnecessay and hence the values of these fields are reset

    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                isEmailVerified: true,
            },
            "Email is verified.",
        ),
    );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User doesn't exist.");
    }

    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified.");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Please verify your email",
        mailgenContent: emailVerificationMailGenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Email has been sent to your refistered email id.",
            ),
        );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access");
    }

    try {
        const decodedRefreshToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        );

        const user = await User.findById(decodedRefreshToken?._id);
        // decodedRefreshToken can access _id because we added that in payload while performing jwt.sign()

        if (!user) {
            throw new ApiError(401, "Invalid refresh token.");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired.");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken: newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);
        // refreshToken is given new name because while unpacking an object, key names must be same

        user.refreshToken = newRefreshToken;
        await user.save();

        return res
            .status(200)
            .cookie("accessToken", accessToken, options) // accessToken is cookie header name
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed.",
                ),
            );
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token.");
    }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist.");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        subject: "Password reset.",
        mailgenContent: forgotPasswordMailGenContent(
            user.username,
            `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
        ),
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent on your mail id.",
            ),
        );
});

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    let hashedResetToken = crypto
        .createHash("sha2256")
        .update(resetToken)
        .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken: hashedResetToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(489, "Token is invalid or expired.");
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully."));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully."));
});

export {
    registerUser,
    login,
    logoutUser,
    getCurrentUser,
    verifyEmail,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changeCurrentPassword,
};
