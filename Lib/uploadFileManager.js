var Config = require('../Config'),
UniversalFunctions = require('../Utils').universalFunctions,
async = require('async'),
Path = require('path'),
fsExtra = require('fs-extra'),
Fs = require('fs'),
AWS = require("aws-sdk"),
mime = require('mime-types'),
moment = require('moment'),
CONSTANTS = require('../Config').constants;


AWS.config.update({
    "bucket": Config.awsConfig.s3BucketCredentials.bucket,
    "accessKeyId": Config.awsConfig.s3BucketCredentials.accessKeyId,
    "secretAccessKey": Config.awsConfig.s3BucketCredentials.secretAccessKey
});
var s3 = new AWS.S3();

function uploadMultipart(fileInfo, uploadCb) {
    var options = {
        Bucket: Config.awsConfig.s3BucketCredentials.bucket,
        Key: fileInfo.filename,
        ACL: 'public-read',
        ContentType: mime.lookup(fileInfo.filename),
        ServerSideEncryption: 'AES256'
    };
    
    s3.createMultipartUpload(options, (mpErr, multipart) => {
        if (!mpErr) {
            Fs.readFile(fileInfo.path, (err, fileData) => {
                
                var partSize = CONSTANTS.FILE_SIZE_IN_BYTES;
                
                
                var parts = Math.ceil(fileData.length / partSize);
                
                async.times(parts, (partNum, next) => {
                    
                    var rangeStart = partNum * partSize;
                    var end = Math.min(rangeStart + partSize, fileData.length);
                    partNum++;
                    async.retry((retryCb) => {
                        s3.uploadPart({
                            Body: fileData.slice(rangeStart, end),
                            Bucket: Config.awsConfig.s3BucketCredentials.bucket,
                            Key: fileInfo.filename,
                            PartNumber: partNum,
                            UploadId: multipart.UploadId
                        }, (err, mData) => {
                            retryCb(err, mData);
                        });
                    }, (err, data) => {
                        next(err, { ETag: data.ETag, PartNumber: partNum });
                    });
                    
                }, (err, dataPacks) => {
                    s3.completeMultipartUpload({
                        Bucket: Config.awsConfig.s3BucketCredentials.bucket,
                        Key: fileInfo.filename,
                        MultipartUpload: {
                            Parts: dataPacks
                        },
                        UploadId: multipart.UploadId
                    }, uploadCb);
                });
            });
        } else {
            uploadCb(mpErr);
        }
    });
}

function uploadFile1(fileObj, folderName, uploadCb) {
    
    var fileName = Path.basename(fileObj.finalUrl);
    var stats = Fs.statSync(fileObj.path);
    var filePublicUrl = null;
    
    var fileSizeInBytes = stats["size"];
    
    if (fileSizeInBytes < CONSTANTS.FILE_SIZE_IN_BYTES) {
        async.retry((retryCb) => {
            Fs.readFile(fileObj.path, (err, fileData) => {
                s3.upload({
                    Bucket: Config.awsConfig.s3BucketCredentials.bucket,
                    Key: folderName + "/" + fileName,
                    Body: fileData,
                    ACL: 'public-read',
                    ContentType: mime.lookup(fileName)
                }, function(err, res) {
                    if(filePublicUrl) {
                        filePublicUrl = res.Location;
                    }
                    retryCb();
                });
            });
        }, uploadCb);
    } else {
        fileObj.filename = fileName;
        uploadMultipart(fileObj, uploadCb)
    }
}


var uploadFilesOnS3 = function(fileData, folderName, callback) {
    var imageFile = false;
    var filename;
    var ext;
    var dataToUpload = []
    
    //check file data
    if (!fileData || !fileData.filename) {
        return callback(Config.APP_CONSTANTS.STATUS_MSG.ERROR.IMP_ERROR)
    } else {
        filename = fileData.filename.toString();
        ext = filename.substr(filename.lastIndexOf('.'))
        var videosFilesExt = ['.3gp', '.3GP', '.mp4', '.MP4', '.avi', '.AVI'];
        var imageFilesExt = ['.jpg', '.JPG', '.jpeg', '.JPEG', '.png', '.PNG', '.gif', '.GIF', '.pdf', '.doc', '.docx'];
        
        
        if (ext) {
            if (imageFilesExt.indexOf(ext) >= 0) {
                imageFile = true
            } else {
                if (!(videosFilesExt.indexOf(ext) >= 0)) {
                    return callback()
                }
            }
        } else {
            return callback()
        }
    }
    
    //  create file names ==============
    fileData.original = UniversalFunctions.getFileNameWithUserId(false, filename, moment(new Date()).unix());
    fileData.thumb = UniversalFunctions.getFileNameWithUserId(true, imageFile && filename || (filename.substr(0, filename.lastIndexOf('.'))) + '.jpg', moment(new Date()).unix());
    
    
    // for set parrallel uploads on s3 bucket
    
    dataToUpload.push({
        path: Path.resolve('.') + '/uploads/' + fileData.thumb,
        finalUrl: Config.awsConfig.s3BucketCredentials.s3URL + "/" + folderName + "/" + fileData.thumb
    })
    
    dataToUpload.push({
        path: fileData.path,
        finalUrl: Config.awsConfig.s3BucketCredentials.s3URL + "/" + folderName + "/" + fileData.original
    })
    
    
    async.auto({
        creatingThumb: function(cb) {
            createThumbnailImage(fileData.path, Path.resolve('.') + '/uploads/' + fileData.thumb, function(err) {
                cb();
            })
        },
        uploadOnS3: ['creatingThumb', function(res, cb) {
            var functionsArray = [];
            
            dataToUpload.forEach(function(obj) {
                functionsArray.push((function(data) {
                    return function(internalCb) {
                        uploadFile1(data, folderName, internalCb);
                    }
                })(obj))
            });
            async.parallel(functionsArray, (err, result) => {
                deleteFile(Path.resolve('.') + '/uploads/' + fileData.thumb);
                cb(err)
            })
        }]
    }, function(err) {
        var responseObject = {
            original: Config.awsConfig.s3BucketCredentials.s3URL + "/" + folderName + "/" + fileData.original,
            thumbnail: Config.awsConfig.s3BucketCredentials.s3URL + "/" + folderName + "/" + fileData.thumb,
            type: imageFile && 'IMAGE' || 'VIDEO'
        };
        callback(err, responseObject);
    })
};

function deleteFile(path) {
    fsExtra.remove(path, function(err) {
        if (err) {
            console.log('error deleting file>>', err)
        }
    });
}

function createThumbnailImage(originalPath, thumbnailPath, callback) {
    var gm = require('gm').subClass({ imageMagick: true });
    gm(originalPath)
    .resize(CONSTANTS.THUMBNAIL_SPECS.THUMB_WIDTH, CONSTANTS.THUMBNAIL_SPECS.THUMB_HEIGHT, "!")
    .autoOrient()
    .write(thumbnailPath, function(err, data) {
        callback(err)
    })
};

module.exports = {
    uploadFilesOnS3: uploadFilesOnS3
}