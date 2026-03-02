import { validationResult } from "express-validator";
import { ApiError } from "../utils/api-error.js";

export const validate = (req, res, next) => {
    const errors = validationResult(req); // errors is an array

    // errors contains object with this format
    // [
    //     { path: "email", msg: "Invalid email" },
    //     { path: "password", msg: "Too short" },
    // ];

    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().map((err) => {
        extractedErrors.push({ [err.path]: err.msg });
    });

    throw new ApiError(422, "Received data is not valid", extractedErrors);
};
