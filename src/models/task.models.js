import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            requied: true,
            trim: true,
        },

        description: {
            type: String,
        },

        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },

        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        status: {
            type: String,
            enum: AvailableTaskStatus,
            default: TaskStatusEnum["TODO"],
        },

        attachments: {
            // type is Array and it contains object with defined keys
            types: [
                {
                    url: String,
                    mimeType: String,
                    size: Number,
                },
            ],
            default: [], // empty Array by default
        },
    },

    { timestamps: true },
);

export const task = mongoose.model("Task", taskSchema);
