// this is a library for storing and rotating logs

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// container for the module
let logs = {};

// Base directory of the logs folder
logs.baseDir = path.join(__dirname, "../.logs/");

// Append a string to a file. create a file if it doesn't exists
logs.append = function(fileName, stringToAppend, callback) {
  let filePath = path.join(this.baseDir, fileName) + ".log";
  fs.open(filePath, "a", (err, fd) => {
    if (!err && fd) {
      // Append the file and close it
      fs.appendFile(fd, stringToAppend + "\n", err => {
        if (!err) {
          fs.close(fd, err => {
            if (!err) {
              callback(false);
            } else {
              callback("Error in closing the file");
            }
          });
        } else {
          callback("Error in appending the file");
        }
      });
    } else {
      callback("could not open the file for appending");
    }
  });
};

// List all the log files and optionally include the compressed logs
logs.list = function(includeCompressedFiles,callback){
  fs.readdir(this.baseDir,(err,logs)=>{
    if(!err && logs && logs.length > 0){
      let trimmedFileNames = [];
      // Iterate each log file and then trim .log and then add it to the trimmedFileNames array.
      for(let log of logs){
        // Add uncompressed log files
        if(log.indexOf('.log') > -1){
          trimmedFileNames.push(log.replace('.log',''));
        }
        // Add the compressed files if includeCompressedFiles is true
        if(log.indexOf('.gz.b64') > -1 && includeCompressedFiles){
          trimmedFileNames.push(log.replace('.gz.b64',''));
        }
      }
      callback(false,trimmedFileNames);
    }else{
      callback(err,data);
    }
  });
}


// compress the content of one .log file into a .gz.b64 file within within the same directory
logs.compress = function(logId,newFileId,callback){
  let sourceFilePath  = path.join(this.baseDir,logId)+'.log'
  let destFilePath = path.join(this.baseDir,newFileId)+'.gz.b64';
  
  // Read the source File
  fs.readFile(sourceFilePath,'utf8',(err,inputString)=>{
    if(!err && inputString){
      // compress the data using gzip
      zlib.gzip(inputString,(err,buffer)=>{
        if(!err && buffer){
          // Send the compressed data to the destination file
          fs.open(destFilePath,'wx',(err,fileDescriptor)=>{
            if(!err && fileDescriptor){
              // write to the destination file
              fs.writeFile(fileDescriptor,buffer.toString('base64'),(err)=>{
                if(!err){
                  // close the destination file
                  fs.close(fileDescriptor,(err)=>{
                    if(!err){
                      callback(false);
                    }else{
                      callback(err);
                    }
                  });
                }else{
                  callback(err);
                }
              });
            }else{
              callback(err);
            }
          });
        }else{
          callback(err);
        }
      })
    }else{
      callback(err);
    }
  }); 
}

// Decompress the content of .gz.b64 file into a string variable
logs.decompress = function(fileId, callback){
  let filePath = path.join(this.baseDir,fileId)+'.gz.b64';
  fs.readFile(filePath,'utf8',(err,str)=>{
    if(!err && str){
      // Decompress the data
      let inputBuffer = Buffer.from(str,'base64');
      zlib.unzip(inputBuffer,(err,outputBuffer)=>{
        if(!err && outputBuffer){
          // callback
          let str = outputBuffer.toString();
          callback(false,str);
        }else{
          callback(err);
        }
      });
    }else{
      callback(err);
    }
  })
};

// Truncate a log file 
logs.truncate = function(logId,callback){
  let filePath = path.join(this.baseDir,logId)+'.log';
  fs.truncate(filePath,0,(err)=>{
    if(!err){
  callback(false);
    }else{
      callback(err);
    }
  });
};


// Export the module
module.exports = logs;
