const path = require("path");
const fs = require("fs");

let libs = {};
libs.baseDir = path.join(__dirname, "../.data/");

libs.dirExists = function(dirPath) {
  return new Promise((resolve, reject) => {
    fs.exists(dirPath, exists => {
      if (!exists) {
        fs.mkdir(dirPath, err => {
          if (!err) {
            resolve("Directory Created.");
          } else {
            reject("Error in creating Directory!!");
          }
        });
      } else {
        resolve("Directory already Exists!!");
      }
    });
  });
};

libs.fileExists = function(dirName,fileName){
  return new Promise((resolve,reject)=>{
    let filePath = path.join(this.baseDir,dirName,fileName)+'.json';
    fs.exists(filePath,(exists)=>{
      if(exists)
        resolve(exists);
      else
      reject(exists);
    })
  });
};

libs.create = function(dirName, fileName, data, callback) {
  let dirPath = path.join(this.baseDir, dirName);
  this.dirExists(dirPath).then(
    resolved => {
      let filePath = path.join(dirPath, fileName) + ".json";
      fs.open(filePath, "wx+", (err, fileDesc) => {
        if (!err) {
          fs.writeFile(fileDesc, JSON.stringify(data), err => {
            if (!err) {
              fs.close(fileDesc, err => {
                if (!err) {
                  callback(null, "File Created and data written to it");
                } else {
                  callback("error in closing the file");
                }
              });
            } else {
              callback("Error in wrirting the data");
            }
          });
        } else {
          callback("File may already exists");
        }
      });
    },
    rejected => {}
  );
};

libs.read = function(dirName, fileName, callback) {
  let filePath = path.join(this.baseDir, dirName, fileName) + ".json";
  fs.open(filePath, "r", (err, fileDesc) => {
    if (!err) {
      fs.readFile(fileDesc, "utf-8", (err, data) => {
        if (!err) {
          fs.close(fileDesc, err => {
            if (!err) {
              callback(null, JSON.parse(data));
            } else {
              callback("error in closing the file");
            }
          });
        } else {
          callback("Error in reading the file.");
        }
      });
    } else {
      callback("Error in opening the file.");
    }
  });
};

libs.objectLength = function(obj) {
  let cnt = 0;
  for (let prop in obj) {
    ++cnt;
  }
  return cnt;
};

libs.readDirectory = function(dirName, callback) {
  let dirPath = path.join(this.baseDir, dirName);
  fs.readdir(dirPath, (err, files) => {
    if (!err) {
      //callback(null, files);
      let usersList = {};
      for (let file of files) {
        let fileName = file.split(".")[0];

        this.read(dirName, fileName, (err, data) => {
          if (!err) {
            usersList[data.phone] = data.firstName + " " + data.lastName;
            if (this.objectLength(usersList) == files.length) {
              callback(null, usersList);
            }
          } else {
            console.log(err);
            console.log("Error while reading " + file);
          }
        });
      }
      //callback(null, usersList);
    } else {
      callback("Error while reading directory");
    }
  });
};

// list all the items in a directory in an Array.
libs.list = function(dirName,callback){
  let dirPath = path.join(__dirname,'/../.data/',dirName);
  fs.readdir(dirPath,(err,files)=>{
    if(!err && files.length > 0){
      let allFiles = [];
      for(let file of files){
        allFiles.push(file.split('.')[0]);
      }
      callback(null,allFiles);
    }else{
      callback(err);
    }
  })
}

libs.update = function(dirName, fileName, data, callback) {
  let filePath = path.join(this.baseDir, dirName, fileName) + ".json";
  fs.open(filePath, "w", data, (err, fileDesc) => {
    if (!err) {
      fs.writeFile(fileDesc, JSON.stringify(data), err => {
        if (!err) {
          fs.close(fileDesc, err => {
            if (!err) {
              callback(null, "File Updated");
            } else {
              callback("error in closing the file");
            }
          });
        } else {
          callback("Error in Updating the file :- " + fileName);
        }
      });
    } else {
      callback("Error in opening file for updation.");
    }
  });
};

libs.delete = function(dirName, fileName, callback) {
  let filePath = path.join(this.baseDir, dirName, fileName) + ".json";
  fs.open(filePath, "r", (err, fileDesc) => {
    if (!err) {
      fs.unlink(filePath, err => {
        if (!err) {
          fs.close(fileDesc, err => {
            if (!err) {
              callback(null, "File Deleted");
            } else {
              callback("error in closing the file");
            }
          });
        } else {
          callback("Error in deleting the file");
        }
      });
    } else {
      callback("Error in opeming the file for deletion");
    }
  });
};

module.exports = libs;
