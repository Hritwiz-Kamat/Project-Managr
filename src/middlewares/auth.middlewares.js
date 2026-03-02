import { User } from "../models/user.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

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

export const validateProjectPermissions = (roles = []) => {
    // roles is an array which includes all the roles which have access to a particular permission
    asyncHandler(async (req, res, next) => {
        const { projectId } = req.params;

        if (!projectId) {
            throw new ApiError(400, "Project ID is missing.");
        }

        const projectMember = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(req.user._id),
        });

        if (!projectMember) {
            throw new ApiError(400, "Project member not found.");
        }

        const currentRole = projectMember?.role;

        req.user.role = currentRole;

        if (!roles.includes(currentRole)) {
            throw new ApiError(
                403,
                "You don't have permission to perform this action",
            );
        }

        next(); // roles.includes(currentRole) -> Only when this condition is true that the next() function executes
        // roles.includes(currentRole) -> This means currentRole is one of the roles in 'roles' array
    });
};
