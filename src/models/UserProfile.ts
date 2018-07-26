
import Promise from "bluebird";
import mongoose, { mongo, Mongoose, MongooseDocument } from "mongoose";

import { prop, Typegoose, ModelType, InstanceType } from "typegoose";

/**
 * UserProfile Schema
 */
export class UserProfile extends Typegoose {
    @prop()
    userId: String;
    @prop()
    name: String;
    @prop()
    avatarUrl: String;
    @prop()
    score: Number;
    @prop()
    createdAt: Date;
}

const UserProfileModel = new UserProfile().getModelForClass(UserProfile);

export default UserProfileModel;