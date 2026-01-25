import mongoose, { Schema } from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const projectMemberSchema = new Schema(
    {
        user: {
            types: Schema.Types.ObjectId,
            ref: "User", // this provides reference to the 'User' schema
            required: true,
        },

        project: {
            types: Schema.Types.ObjectId,
            ref: "Project", // this provides reference to the 'User' schema and identifies on the bases of ObjectId
            required: true,
        },

        role: {
            type: String,
            enum: AvailableUserRole,
            default: UserRolesEnum["MEMBER"],
        },
    },
    { timestamps: true },
);

export const ProjectMember = mongoose.model(
    "ProjectMember",
    projectMemberSchema,
);
