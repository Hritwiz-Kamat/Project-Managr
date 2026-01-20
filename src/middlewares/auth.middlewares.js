import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";

// middle functions always take (req, res, next) as parameters.
export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", ""); // replace() is used because we only want the token 
        // These are 2 ways of getting token separated by logic OR.

    if (!token) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // verify() is used to decode a JWT token

        const user = await User.findById(decodedToken?._id).select(
            "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
        );

        if (!user) {
            throw new ApiError(401, "Access token is not valid");
        }

        req.user = user; // data about user appended into req | req is an object
        next();
    } catch (error) {
        throw new ApiError(401, "Access token is not valid");
    }
});
