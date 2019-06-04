let libs = require("./libs");
let helper = require("./helpers");
let config = require("../config");
const fs = require('fs');
let handler = {};


/**
 * 
 *  ************ **************  *************    HTML API HANDLERS    ********** ********** ****** 
 * 
 */

handler.index = function(data,callback){
  if(data.method == 'get'){
    // get the index template html and return it.
    helper.getTemplate('index',(err,htmlData)=>{
      if(!err && htmldata){
        callback(200,htmlData,'html');
      }else{
        callback(500,undefined,'html');
      }
    });
  }else{
    callback(405,undefined,'html');
  }
};


/**
 * 
 *  ************ **************  *************    JSON API HANDLERS    ********** ********** ****** 
 * 
 */
/*
handler.index = function(data, callback) {
  data["index"] = "Homepage";
  callback(200, data);
};*/

handler.ping = function(data, callback) {
  data["ping"] = "Server Up";
  callback(200, data);
};

handler.sample = function(data, callback) {
  data["sampleResponse"] = "Sample Handler Response";
  callback(406, data);
};

handler.api = function(data, callback) {
  data["apiData"] = "API Response";
  callback(200, data);
};

handler.notFound = function(data, callback) {
  callback(404,data);
};

// USERS ROUTE
handler.users = function(data, callback) {
  let allowedMethods = ["get", "post", "put", "delete"];
  if (allowedMethods.indexOf(data.method) != -1) {
    handler._users[data.method](data, callback);
  } else {
    callback(405, { error: "Method not allowed" });
  }
};

// USERS Request Container
handler._users = {};

// Required Fields: - firstNme,lastName,password, phone tosAgreement
handler._users.post = function(data, callback) {
  let userData = data.payload; //JSON.parse(data);
  let firstName =
    typeof userData.firstName == "string" &&
    userData.firstName.trim().length > 0
      ? userData.firstName.trim()
      : false;
  let lastName =
    typeof userData.lastName == "string" && userData.lastName.trim().length > 0
      ? userData.lastName.trim()
      : false;
  let phone =
    typeof userData.phone == "string" && userData.phone.length == 10
      ? userData.phone
      : false;
  let password =
    typeof userData.password == "string" && userData.password.trim().length > 0
      ? userData.password.trim()
      : false;
  let tosAgreement =
    typeof userData.tosAgreement == "boolean" && userData.tosAgreement == true
      ? userData.tosAgreement
      : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    libs.read("users", phone, (err, data) => {
      if (err) {
        // Hash the password before saving it to file system
        let hashedPassword = helper.hash(password);
        if (hashedPassword) {
          let userToSave = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            password: hashedPassword,
            tosAgreement: true
          };
          libs.create("users", phone, userToSave, (err, data) => {
            if (!err) {
              callback(200, { response: "User created successfully" });
            } else {
              callback(500, { error: err });
            }
          });
        } else {
          callback(500, { error: "error in hashing the password" });
        }
      } else {
        callback(400, {
          error: `A user with  phone ${data.phone} and name ${data.firstName +
            " " +
            data.lastName} already exists`
        });
      }
    });
  } else {
    callback(400, { error: "Missing Required fields" });
  }
};

// Get the info of all the users in object as phone as a key and name as value
/*
handler._users.get = function(data, callback) {
  libs.readDirectory("users", (err, data) => {
    if (!err) {
      callback(200, data);
    } else {
      callback(404, { response: "No USERS " });
    }
  });
};
*/

handler._users.get = function(data, callback) {
  let phone =
    typeof data.queryString.phone == "string" &&
    data.queryString.phone.length == 10
      ? data.queryString.phone
      : null;
  if (phone != null) {
    let token = typeof data.header.token == "string" ? data.header.token : null;
    handler._tokens.validateToken(token, phone, isValid => {
      if (isValid) {
        libs.read("users", phone, (err, userData) => {
          if (!err && userData) {
            callback(200, userData);
          } else {
            callback(500, { error: err });
          }
        });
      } else {
        callback(500, { error: "Token is not valid" });
      }
    });
  }
};

// update the userinfo primary key is phone, if no value or not desired value use previous val
handler._users.put = function(data, callback) {
  let userData = data.payload;
  let phone =
    typeof userData.phone == "string" && userData.phone.length == 10
      ? userData.phone
      : null;
  if (phone != null) {
    // First get the token from headers to validate the user
    let token = typeof data.header.token == "string" ? data.header.token : null;
    handler._tokens.validateToken(token, phone, isValid => {
      // if token is valid then only continue otherwise error callback
      if (isValid) {
        libs.read("users", phone, (err, data) => {
          if (!err) {
            let firstName =
              typeof userData.firstName == "string"
                ? userData.firstName
                : data.firstName;
            let lastName =
              typeof userData.lastName == "string"
                ? userData.lastName
                : data.lastName;
            let password =
              typeof userData.password == "string"
                ? helper.hash(userData.password)
                : data.password;
            //let tosAgreement  = typeof userData.firstName == 'string' ? userData.firstName : null;
            let updatedUser = {
              phone: phone,
              firstName: firstName,
              lastName: lastName,
              password: password,
              tosAgreement: data.tosAgreement
            };

            libs.update("users", phone, updatedUser, (err, data) => {
              if (!err) {
                callback(200, data);
              } else {
                callback(500, err);
              }
            });
          } else {
            callback(400, { response: "Enter Valid phone number" });
          }
        });
      } else {
        callback(400, { Error: "Token is not valid or may be expired" });
      }
    });
  } else {
    callback(400, "Enter a valid phone");
  }
};

// to delete pass the fileName ie userPhone in querystring and token in headers.
handler._users.delete = function(data, callback) {
  let phone =
    typeof data.queryString.phone == "string" &&
    data.queryString.phone.length == 10
      ? data.queryString.phone
      : null;
  if (phone != null) {
    let token = typeof data.header.token == "string" ? data.header.token : null;
    handler._tokens.validateToken(token, phone, isValid => {
      if (isValid) {
        // lookup the user before deleting it
        libs.read("users",phone,(err,userData)=>{
          if(!err && userData){
            // if user exists then delete the user 
              libs.delete("users", phone, err => {
                if (!err) {
                  //callback(200, { response: "File deleted successfully" });
                  // if the user is deleted then remove all the checks created by that user
                  // get the checks array of the user 
                  let userChecks = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : [];
                  if(userChecks.length >0){
                    for(let check of userChecks){
                      libs.fileExists("checks",check).then((exists)=>{
                        libs.delete("checks",check,(err,res)=>{
                            if(err == null){
                              if(userChecks.indexOf(check) == userChecks.length-1){
                                callback(200,`All Checks for this user with phone ${userData.phone} and the user ${userData.firstName} ${userData.lastName} is deleted`);
                              }
                                
                            }else{
                              callback(500,{error:`Error while deleting the ${check} at index ${check}. All Checks may not have been Deleted. `});
                            }
                        });
                      });
                    }
                  }
                } else {
                  callback(500, { error: err });
                }
              });
          }else{
            callback(500,{error:'couldnt find the specified user with given phone number for deletion operation'});
          }
        });
      } else {
        callback(400, { error: "Please enter a valid token" });
      }
    });
  } else {
    callback(400, { error: "Please enter a valid phone number" });
  }
};

// TOKENS ROUTE
handler.tokens = function(data, callback) {
  let allowedMethods = ["get", "post", "put", "delete"];
  if (allowedMethods.indexOf(data.method) != -1) {
    handler._tokens[data.method](data, callback);
  } else {
    callback(405, { error: "Method not allowed" });
  }
};

// TOKENS CONTAINER
handler._tokens = {};

// TOKENS POST ROUTE --> phone and password are required to create token
handler._tokens.post = function(data, callback) {
  let phone =
    typeof data.payload.phone == "string" && data.payload.phone.length == 10
      ? data.payload.phone
      : null;
  let password =
    typeof data.payload.password == "string" ? data.payload.password : null;

  if (phone != null) {
    // check if the user with same phone exisis
    libs.read("users", phone, (err, userData) => {
      if (!err && userData) {
        if (helper.hash(password) == userData.password) {
          // If password and phone matches then create tokenId and expiration the create token object and persist it to tokens directory
          let tokenId = helper.createRandomString(20);
          let expiration = Date.now() + 60 * 60 * 1000;
          let tokenObject = {
            phone: phone,
            tokenId: tokenId,
            expiration: expiration
          };
          libs.create("tokens", tokenId, tokenObject, (err, tokenData) => {
            if (!err && tokenData) {
              callback(200, tokenData);
            } else {
              callback(500, { error: "Error in creating Token" });
            }
          });
        } else {
          callback(400, {
            error: "Password do not matches. Please enter correct password "
          });
        }
      } else {
        callback(400, { error: "User with specified phone does not exists" });
      }
    });
  } else {
    callback(400, { error: "Please Enter a Valid Phone Number" });
  }
};

// TOKENS GET get the tokenId from queryString
handler._tokens.get = function(data, callback) {
  let tokenId =
    typeof data.queryString.id == "string" ? data.queryString.id : null;
  if (tokenId != null) {
    libs.read("tokens", tokenId, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(400, { error: err });
      }
    });
  } else {
    callback(400, { error: "Please provide valid string token id" });
  }
};

// UPDATE the token if it is not expired yet. If not expired update it's expiration will be updated to one more hour.
handler._tokens.put = function(data, callback) {
  let id = typeof data.payload.id == "string" ? data.payload.id : null;
  let extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? data.payload.extend
      : null;

  if (id != null && extend != null) {
    libs.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.expiration > Date.now()) {
          tokenData.expiration += 60 * 60 * 1000;
          libs.update("tokens", id, tokenData, (err, updatedData) => {
            if (!err && updatedData) {
              callback(200, updatedData);
            } else {
              callback(500, { error: err });
            }
          });
        } else {
          callback(500, { error: "Token already expired" });
        }
      } else {
        callback(400, { error: "Please Enter a valid TokenId" });
      }
    });
  } else {
    callback(400, {
      error: "Please enter valid string id and set extend to true"
    });
  }
};

handler._tokens.delete = function(data, callback) {
  let id =
    typeof data.queryString.id == "string" && data.queryString.id.length == 20
      ? data.queryString.id
      : null;
  if (id != null) {
    libs.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        libs.delete("tokens", id, (err, deleteData) => {
          if (!err && deleteData) {
            callback(200, deleteData);
          } else {
            callback(500, { error: err });
          }
        });
      } else {
        callback(400, { error: err });
      }
    });
  } else {
    callback(400, "Please Enter a valid string ID");
  }
};

// validate the token sent in header with the phone number and check whether token if valid and have not exppired till now
handler._tokens.validateToken = function(token, phone, callback) {
  if (token != null) {
    libs.read("tokens", token, (err, tokenData) => {
      if (!err && tokenData) {
        if (tokenData.phone == phone && tokenData.expiration > Date.now()) {
          callback(true);
        } else {
          callback(false);
        }
      } else {
        callback(false);
      }
    });
  } else {
    callback(false);
  }
};

// CHECKS ROUTE
handler.checks = function(data, callback) {
  let allowedMethods = ["get", "post", "put", "delete"];
  if (allowedMethods.indexOf(data.method) != -1) {
    handler._checks[data.method](data, callback);
  } else {
    callback(405, { error: "Method not allowed" });
  }
};

// CHECKS CONTAINER
handler._checks = {};

// Checks :- Post.
// Required data :- protocol, url, method, successCodes, timeoutSeconds
handler._checks.post = function(data, callback) {
  let protocol =
    typeof data.payload.protocol == "string" &&
    ["http", "https"].indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;

  let url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;

  let method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;

  let successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;

  let timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" &&
    data.payload.timeoutSeconds % 1 === 0 &&
    data.payload.timeoutSeconds >= 1 &&
    data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // Get the Token from the Headers
    let token =
      typeof data.header.token == "string" ? data.header.token : false;
    if (token) {
      // Read the Token Data
      libs.read("tokens", token, (err, tokenData) => {
        if (!err && tokenData) {
          // If token exists then read  the user using phone number
          libs.read("users", tokenData.phone, (err, userData) => {  
            if (!err && userData) {
              // if user don't already have a check array give it an empty array otherwise take its check array.
              let userChecks =
                typeof userData.checks == "object" &&
                userData.checks instanceof Array
                  ? userData.checks
                  : [];
              // verify that the users has less than the number of max-checks per user
              if (userChecks.length < config.maxChecks) {
                // create a random id for check
                let checkId = helper.createRandomString(20);
                // create the check id and includes the user phone. we will store a check with reference of its creator. and these creator will also have a reference on their
                // object to each of their checks. A way like noSql style.
                let checkObject = {
                  id: checkId,
                  userPhone: userData.phone,
                  tokenPhone: tokenData.phone,
                  protocol: protocol,
                  url: url,
                  method: method,
                  successCodes: successCodes,
                  timeoutSeconds: timeoutSeconds
                };
                // save the checkObject
                libs.create("checks", checkId, checkObject, err => {
                  if (!err) {
                    // Add the checkId to users object
                    userChecks.push(checkId);
                    userData.checks = userChecks;

                    // update the new user data with new checks
                    libs.update("users", userData.phone, userData, err => {
                      if (!err) {
                        // Return the data about the new check to the requester
                        callback(200, checkObject);
                      } else {
                        callback(500, {
                          error: "Couldnt update the user with new check"
                        });
                      }
                    });
                  } else {
                    callback(500, { error: "Couldn't create the check" });
                  }
                });
              } else {
                callback(400, {
                  error: "The user already has the maximum number of checks"
                });
              }
            } else {
              callback(403, {
                error: "TokenData do not corresponds to any user"
              });
            }
          });
        } else {
          callback(403, { error: "Please provide a valid Token" });
        }
      });
    } else {
      callback(400, { error: "Please provide Token in request headers" });
    }
  } else {
    callback(400, { error: "Missing required inputs or inputs are invalid" });
  }
};

// CHECKS GET

handler._checks.get = function(data, callback) {
  let id =
    typeof data.queryString.id == "string" && data.queryString.id.length === 20
      ? data.queryString.id
      : null;
  if (id != null) {
    libs.read("checks", id, (err, checkData) => {
      if (!err && checkData) {
        // If check exists get the token from the header
        let token =
          typeof data.header.token == "string" ? data.header.token : null;
        // validate the token for a valid user
        handler._tokens.validateToken(token, checkData.userPhone, isValid => {
          if (isValid) {
            // if checkexists and user for that check also exists and token is valid then send the checkdata
            callback(200, checkData);
          } else {
            callback(500, { error: "Token is not valid" });
          }
        });
      } else {
        callback(404, { error: "Please Pass a valid checkId" });
      }
    });
  } else {
    callback(400, {
      error: "Please pass a valid check id in queryParams with name id"
    });
  }
};

// CHECKS PUT  --> id is mandatory for checks to update and any one optional data which we want to update
handler._checks.put = function(data, callback) {
  let id =
    typeof data.payload.id == "string" && data.payload.id.length === 20
      ? data.payload.id
      : null;
  if (id != null) {
    let protocol =
      typeof data.payload.protocol == "string" &&
      ["http", "https"].indexOf(data.payload.protocol) > -1
        ? data.payload.protocol
        : false;

    let url =
      typeof data.payload.url == "string" && data.payload.url.trim().length > 0
        ? data.payload.url.trim()
        : false;

    let method =
      typeof data.payload.method == "string" &&
      ["post", "get", "put", "delete"].indexOf(data.payload.method) > -1
        ? data.payload.method
        : false;

    let successCodes =
      typeof data.payload.successCodes == "object" &&
      data.payload.successCodes instanceof Array &&
      data.payload.successCodes.length > 0
        ? data.payload.successCodes
        : false;

    let timeoutSeconds =
      typeof data.payload.timeoutSeconds == "number" &&
      data.payload.timeoutSeconds % 1 === 0 &&
      data.payload.timeoutSeconds >= 1 &&
      data.payload.timeoutSeconds <= 5
        ? data.payload.timeoutSeconds
        : false;

    let token = typeof data.header.token == "string" ? data.header.token : null;
    if (token != null) {
      libs.read("checks", id, (err, checkData) => {
        if (!err && checkData) {
          handler._tokens.validateToken(token, checkData.userPhone, isvalid => {
            if (isvalid) {
              if (protocol || url || method || successCodes || timeoutSeconds) {
                if (protocol) {
                  checkData.protocol = protocol;
                }
                if (url) {
                  checkData.url = url;
                }
                if (method) {
                  checkData.method = method;
                }
                if (successCodes) {
                  checkData.successCodes = successCodes;
                }
                if (timeoutSeconds) {
                  checkData.timeoutSeconds = timeoutSeconds;
                }
                libs.update("checks", id, checkData, (err, updateData) => {
                  if (err == null) {
                    callback(200, checkData);
                  } else {
                    callback(500, { error: err });
                  }
                });
              } else {
                callback(400, { error: "Missing optional data to update" });
              }
            } else {
              callback(403, { error: "Token provided is not valid" });
            }
          });
        } else {
          callback(500, {
            error: "Check id provided in request body is not valid"
          });
        }
      });
    } else {
      callback(403, { error: "Please provide a token in request header" });
    }
  } else {
    callback(400, { error: "Missing required field checkId in request body" });
  }
};

// CHECK DELETE
// get the check id from the query string the read the check. Then get the token from the header then verify the token
// if token is verified then delete the check . then if not error in deleting then lookup the user and update the user check array and remove that check.

handler._checks.delete = function(data, callback) {
  let checkId =
    typeof data.queryString.id == "string" ? data.queryString.id : null;
  if (checkId != null) {
    // if checkid is there read the check data
    libs.read("checks", checkId, (err, checkData) => {
      if (!err && checkData) {
        // Get the token from the header
        let token =
          typeof data.header.token == "string" ? data.header.token : null;
        // validate the token for a valid user
        handler._tokens.validateToken(token, checkData.userPhone, isValid => {
          if (isValid) {
            // if checkexists and user for that check also exists and token is valid then delete the check
            libs.delete("checks", checkId, err => {
              if (!err) {
                // if not error lookup the user
                libs.read("users", checkData.userPhone, (err, userData) => {
                  if (!err && userData) {
                    let userChecks =
                      typeof userData.checks == "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];
                    let indexToDelete = userChecks.indexOf(checkId);
                    if (indexToDelete > -1) {
                      // remove the check from checks array
                      userChecks.splice(indexToDelete, 1);
                      // update the user
                      libs.update("users", userData.phone, userData, err => {
                        if (err == null) {
                          callback(200, userData);
                        } else {
                          callback(500, {
                            error:
                              "could not update user after modifying the checks array"
                          });
                        }
                      });
                    } else {
                      callback(500, {
                        error:
                          "Checkid not found in users check Array so couldnt remove it"
                      });
                    }
                  } else {
                    callback(500, {
                      error:
                        "Couldnt find the user who created the check so couldnt update the checks array of the user"
                    });
                  }
                });
              } else {
                callback(500, { error: "Error in deleting the check" });
              }
            });
          } else {
            callback(500, { error: "Token is not valid" });
          }
        });
      } else {
        callback(404, {
          error:
            "Please provide a valid checkid. Provided checkid do not exists"
        });
      }
    });
  } else {
    callback(400, {
      error: "Please pass a valid checkId as query param named id"
    });
  }
};

module.exports = handler;
