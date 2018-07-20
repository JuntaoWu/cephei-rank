
import Promise from "bluebird";
import mongoose, { mongo, Mongoose, MongooseDocument, version } from "mongoose";

import { prop, Typegoose, ModelType, InstanceType } from "typegoose";

/**
 * Version Schema
 */
export class Version extends Typegoose {
    @prop()
    version: String;
    @prop()
    createdAt: Date;
}

const VersionModel = new Version().getModelForClass(Version);

export default VersionModel;