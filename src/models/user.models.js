import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
    {
        avatar: {
            type: {
                url: String,
                localPath: String,
            },
            default: {
                url: `https://placehold.co/200x200`,
                localPath: "",
            },
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        refreshToken: {
            type: String,
        },
        forgotPasswordToken: {
            type: String,
        },
        forgotPasswordExpiry: {
            type: Date,
        },
        emailVerificationToken: {
            type: String,
        },
        emailVerificationExpiry: {
            type: Date,
        },
    },
    {
        timestamps: true,
    },
);

// Pre/Post hook for a schema
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10); // 10 rounds of hashing. | Hashing is one way.
    next();
});

// Method for a schema
userSchema.methods.isPasswordCorrect = async function (
    password_to_be_verified,
) {
    return await bcrypt.compare(password_to_be_verified, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        // Payload
        {
            _id: this._id,
            email: this.email,
            username: this.username,
        },
        // Secret
        process.env.ACCESS_TOKEN_SECRET,
        // Expiry time
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        // Payload
        {
            _id: this._id,
        },
        // Secret
        process.env.REFRESH_TOKEN_SECRET,
        // Expiry time
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
    );
};

userSchema.methods.generateTemporaryToken = function () {
    const unHashedToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto
        .createHash("sha256")
        .update(unHashedToken)
        .digest("hex");

    const tokenExpiry = Date.now() + 20 * 60 * 1000; // added 20 mins meaning token will expire after 20 mins | Format: (min * second * millisecond)
    return { unHashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);
