import { body } from "express-validator";
import { AvailableUserRole } from "../utils/constants.js";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required") // withMessage() only works if notEmpty() return false.
            .isEmail()
            .withMessage("Email is invalid"),

        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required.")
            .isLowercase()
            .withMessage("Username must be in lowercase.")
            .isLength({ min: 3, max: 12 })
            .withMessage("Username must have atleast 3 characters."),

        body("password").trim().notEmpty().withMessage("Password is required."),
        // .isStrongPassword({
        //     minLength: 8, // at least 8 chars
        //     minLowercase: 1, // at least 1 a-z
        //     minUppercase: 1, // at least 1 A-Z
        //     minNumbers: 1, // at least 1 digit
        //     minSymbols: 1, // at least 1 special char
        // })
        // .withMessage(
        //     "Password must be at least 8 characters and include atleast 1 uppercase, lowercase, number, and symbol.",
        // ),

        body("fullName").optional().trim(),
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .trim()
            .isEmail()
            .withMessage("Email is invalid"),

        body("password").notEmpty().withMessage("Password is required."),
    ];
};

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword").notEmpty().withMessage("Old Password required"),

        body("newPassword").notEmpty().withMessage("New password is required."),
    ];
};

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required.")
            .isEmail()
            .withMessage("Email is invalid"),
    ];
};

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword").notEmpty().withMessage("Password is required."),
    ];
};

const createProjectValidator = () => {
    return [
        body("name").notEmpty().withMessage("Name is required"),

        body("description").optional(),
    ];
};

const addMemberToProjectValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),

        body("role")
            .notEmpty()
            .withMessage("Role is required.")
            .isIn(AvailableUserRole)
            .withMessage("Role is invalid"),
    ];
};

export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator,
    createProjectValidator,
    addMemberToProjectValidator,
};
