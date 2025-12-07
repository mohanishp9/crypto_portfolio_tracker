import mongoose, { Schema, Model, HydratedDocument } from "mongoose";
import { IUser } from "../types/user.types";
import bcrypt from "bcryptjs";

// --------------------------------------------------
// 1. Instance methods for each user document
// --------------------------------------------------
// This interface lists custom methods that will be available
// on *each document* (e.g. user.comparePassword()).
interface IUserMethods {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// --------------------------------------------------
// 2. UserModel Type = Mongoose Model with custom methods
// --------------------------------------------------
// Model<IUser, QueryHelpers, InstanceMethods>
// - IUser = document shape
// - {}    = no custom Query Helpers
// - IUserMethods = instance methods added to each document
type UserModel = Model<IUser, {}, IUserMethods>;

// --------------------------------------------------
// 3. Define the User Schema
// --------------------------------------------------
// Schema<DocType, ModelType, InstanceMethods>
const userSchema = new Schema<IUser, UserModel, IUserMethods>({
    // User's full name
    name: {
        type: String,
        required: true,
        trim: true,
    },

    // User email - must be unique and stored lowercase
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    // Hashed password (plain password never stored)
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
},
    {
        // Automatically adds createdAt and updatedAt fields
        timestamps: true,
    });

// --------------------------------------------------
// 4. Pre-save Hook (Runs BEFORE .save())
// --------------------------------------------------
// Types:
// HydratedDocument<IUser> = actual document with Mongoose functions
// This hook hashes the password before saving it to the database.
userSchema.pre<HydratedDocument<IUser>>("save", async function () {
    // If password was NOT changed → skip hashing
    if (!this.isModified("password")) {
        return;
    }

    // Hash password using bcrypt (salt = 10)
    this.password = await bcrypt.hash(this.password, 10);
});

// --------------------------------------------------
// 5. Instance Method: comparePassword()
// --------------------------------------------------
// This method will be available on every user document.
// Used during login to check if the provided password matches
// the hashed password stored in DB.
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    // bcrypt.compare returns true/false
    return await bcrypt.compare(candidatePassword, this.password);
};

// --------------------------------------------------
// 6. Create and export the User model
// --------------------------------------------------
// model<DocType, ModelType>("collectionName", schema)
// This binds:
// - IUser document type
// - UserModel class type (with our custom methods)
// - userSchema definition and hooks
const User = mongoose.model<IUser, UserModel>("User", userSchema);

export default User;