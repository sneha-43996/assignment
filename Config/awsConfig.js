'use strict';

var s3BucketCredentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    bucket: process.env.AWS_BUCKET_NAME,
    s3URL: process.env.AWS_S3_URL,
    folder: {
        "profilePicture": "profile_images",
        "thumbnail": "thumbnail",
        "original": "original",
        "user": "user"
    }

};

module.exports = {
    s3BucketCredentials: s3BucketCredentials
};