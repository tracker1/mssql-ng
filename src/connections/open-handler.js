let {connections, promises} = require('../cache');
let shadowClose = require('./connections/shadow-close');

module.exports = handleOpen;

//handle the establishment of the connection
function handleOpen(err,resolve,reject,key,connection) {
  //error, remove cached entry, reject the promise
  if (err) {
    delete promises[key];
    return reject(err);
  }

  //handle close requests
  shadowClose(connection);

  //create a reference to the original connection for cleanup
  connection._mssqlngKey = key;
  connections[key] = connection;

  //resolve the promise
  return resolve(connection);
}
