import { default as UserProfileModel, UserProfile } from "../models/UserProfile";

import { Request, Response, NextFunction } from "express";

import * as crypto from "crypto";

import * as redis from "../redis";

// GET: /UserProfile/check
export let uploadScore = async (req: Request, res: Response, next: NextFunction) => {
    console.log("uploadScore");
    const player: UserProfile = req.body;
    UserProfileModel.findOne({ userId: player.userId }).then(userProfile => {
        let newScore = false;
        if (userProfile) {
            userProfile.name = player.name;
            userProfile.avatarUrl = player.avatarUrl;
            if (player.score > userProfile.score) {
                userProfile.score = player.score;
                newScore = true;
            }
        }
        else {
            userProfile = new UserProfileModel();
            userProfile.userId = player.userId;
            userProfile.name = player.name;
            userProfile.avatarUrl = player.avatarUrl;
            userProfile.score = player.score;
            userProfile.createdAt = new Date();
            newScore = true;
        }
        userProfile.save().then(savedUserProfile => {
            if (newScore) {
                const client = redis.getInstance();
                client.zadd("ring", userProfile.score.toString(), userProfile.userId.toString());
            }

            res.json({
                error: false,
                message: "OK"
            });
        }).catch(error => {
            res.json({
                error: true,
                message: error && error.message || "Save userProfile error"
            });
        });
    });
};

// POST: /UserProfile/release
export let leaderBoard = async (req: Request, res: Response, next: NextFunction) => {
    console.log("leaderBoard");

    let skip = +(req.query.skip) || 0;
    skip = Math.max(0, skip);

    let limit = +(req.query.limit) || 50;
    limit = Math.max(0, limit);

    const client = redis.getInstance();
    client.zrevrange("ring", skip, skip + limit - 1, (redisError, redisResult) => {
        console.log(redisResult);
        const rankMap: any = {};
        redisResult.forEach((userId: string, index: number) => {
            rankMap[userId] = skip + index + 1;
        });

        UserProfileModel.find({ userId: { "$in": redisResult } }).then(dbResult => {
            res.json({
                error: false,
                message: "OK",
                data: dbResult.map((user, index) => {
                    return {
                        userId: user.userId,
                        name: user.name,
                        avatarUrl: user.avatarUrl,
                        score: user.score,
                        rank: rankMap[user.userId.toString()]
                    };
                }).sort((lhs, rhs) => {
                    return lhs.rank - rhs.rank;
                })
            });
        });
    });
};

/**
 * query player's rank with userId.
 * @param params userId
 */
export let playerRank = async (req: Request, res: Response, next: NextFunction) => {
    console.log("playerRank");
    const userId = req.query.userId;
    const client = redis.getInstance();

    client.zrevrank("ring", userId, (redisError, redisResult) => {
        console.log(redisResult);
        if (!redisResult && redisResult !== 0) {
            return res.json({
                error: true,
                message: "No such user",
                data: undefined
            });
        }
        UserProfileModel.findOne({ userId: userId }).then(user => {
            res.json({
                error: false,
                message: "OK",
                data: {
                    userId: user.userId,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    score: user.score,
                    rank: redisResult + 1
                }
            });
        });
    });
};

