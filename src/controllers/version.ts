import { default as VersionModel, Version } from "../models/Version";

import { Request, Response, NextFunction } from "express";

import * as crypto from "crypto";

// GET: /version/check
export let checkVersion = async (req: Request, res: Response, next: NextFunction) => {

    const version = req.query.version;  // list versions greater than query.version.

    this.list({ version: version })
        .then((versions: any) => {
            if (versions && versions.length) {
                res.json({
                    error: 0,
                    message: "OK",
                    data: {
                        version: versions[0].version,
                        hasUpdate: false
                    }
                });
            }
            else {
                res.json({
                    error: 0,
                    message: "OK",
                    data: {
                        version: version,
                        hasUpdate: false
                    }
                });
            }
        })
        .catch(next);
};

// POST: /version/release
export let releaseVersion = async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    const hmac = crypto.createHmac("sha256", req.app.get("heroku_secret"));
    const calculatedHmac = hmac.update(req.body).digest().toString("base64");
    const herokuHmac = req.headers["Heroku-Webhook-Hmac-SHA256"];

    if (herokuHmac) {
        this.create({
            version: req.body.data.version
        });
    }
    res.sendStatus(204);
};

export let load = async (params: any) => {
    return VersionModel.findOne({ version: params.version });
};

export let list = async (params: { version?: string, limit?: number, skip?: number }) => {
    const { version = "0.0.0", limit = 50, skip = 0 } = params;
    return await VersionModel.find({ version: { "$gt": version } }).sort("-version")
        .skip(+skip)
        .limit(+limit)
        .exec();
};

export let get = (req: Request, res: Response) => {
    return res.json(req.params.version);
};

export let create = async (body: any) => {
    if (!body || !body.version) {
        return;
    }
    const existsItem = await VersionModel.findOne({ version: body.version });
    if (existsItem) {
        return existsItem;
    }
    const version = new VersionModel(body);
    await version.save();
    return VersionModel.findOne();
};

export let update = (version: string, body: Version) => {
    return load({ version: version }).then(async (version) => {
        return version.save();
    });
};

export let remove = (params: any) => {
    return load(params).then((version) => version.remove());
};
