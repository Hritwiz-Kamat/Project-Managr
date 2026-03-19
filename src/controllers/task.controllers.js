import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { Task } from "../models/task.models.js";
import { subTask } from "../models/subtask.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const tasks = await Task.find({
        // tasks is an array
        project: new mongoose.Types.ObjectId(projectId),
    }).populate("assignedTo", "avatar username fullName");

    return res
        .status(201)
        .json(new ApiResponse(201, tasks, "Tasks fetched successfully."));
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const files = req.files || []; // files is an array as uploaded files are in an array because a multer middleware ran before this

    const attachments = files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/images/${file.originalname}`,
            mimetype: file.mimetype, // png, pdf, jpg, mp4, etc.
            size: file.size, // file size in bytes
        };
    });

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo
            ? new mongoose.Types.ObjectId(assignedTo)
            : undefined,
        status,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully."));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    // task is an array
    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                        avatar: 1,
                    },
                ],
            },
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "subtasks",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                                },
                                {
                                    $addFields: {
                                        createdBy: {
                                            $arrayElemAt: ["$createdBy", 0],
                                        },
                                    },
                                },
                            ],
                        },
                    },
                ],
            },
        },
        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0],
                },
            },
        },
    ]);

    if (!task || task.length === 0) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { title, description, status } = req.body;
    const { projectId, taskId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project does not exist.");
    }

    const task = await Task.findByIdAndUpdate(
        taskId,
        {
            $set: {
                description: description,
                status: status,
            },
        },
        {
            new: true,
        },
    );

    if (!task) {
        throw new ApiError(404, "Task does not exist.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task updated successfully."));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project does not exist.");
    }

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
        throw new ApiError(404, "Task does not exist.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task deleted successfully."));
});

const createSubTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;
    const { title } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project does not exist.");
    }

    const task = await Task.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!task) {
        throw new ApiError(404, "Task does not exist.");
    }

    const createdSubTask = await subTask.create({
        title,
        task: new mongoose.Types.ObjectId(taskId),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdSubTask,
                "Subtask created successfully.",
            ),
        );
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;
    const { title, isCompleted } = req.body;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project does not exist.");
    }

    const task = await Task.findOne({
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!task) {
        throw new ApiError(404, "Task does not exist.");
    }

    const updatedSubTask = await subTask.findByIdAndUpdate(
        subTaskId,
        {
            title,
            isCompleted,
        },
        {
            new: true,
        },
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedSubTask,
                "Subtask updated successfully.",
            ),
        );
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project does not exist.");
    }

    const subTaskDoc = await subTask.findById(subTaskId);

    if (!subTaskDoc) {
        throw new ApiError(404, "Subtask does not exist.");
    }

    const task = await Task.findOne({
        _id: new mongoose.Types.ObjectId(subTaskDoc.task),
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!task) {
        throw new ApiError(404, "Task does not exist.");
    }

    const deletedSubTask = await subTask.findByIdAndDelete(subTaskId);

    if (!deletedSubTask) {
        throw new ApiError(404, "Subtask does not exist.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                deletedSubTask,
                "Subtask deleted successfully.",
            ),
        );
});

export {
    getTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
};
