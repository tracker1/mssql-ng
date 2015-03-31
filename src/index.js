require('cc-globals');

var Promise = require('i-promise');
var mssql = require('mssql');
var stringify = require('json-stable-stringify');
var clone = require('safe-clone-deep');
var processQuery = require('process-query');
var promises = {}; //promises for connections
var connections = {}; //connections


//main export function
module.exports = getConnection;

//clone mssql
R.forEach((prop)=>module.exports[prop] = mssql[prop], R.keys(mssql));

//replace close method with this module's close method
module.exports.close = closeConnection;


//gets/uses a pooled connection against the options specified
function getConnection(options) {
  //clone options
  options = clone(options);

  //serialize the options as a key for pools
  var key = stringify(options || {});

  //if there's already a promise for the given connection, return it
  if (promises[key]) return promises[key];

  //create a new promise for the given connection options
  var promise = new Promise(function(resolve,reject){
    //create a new mssql connection
    var connection = new mssql.Connection(options,(err)=>handleConnection(resolve,reject,key,connection,err));
  });

  //patch promise
  promise._mssqlngKey = key;
  promise.close = (...args)=>promise.then((conn)=>conn.close());
  promise.query = (templateParts, ...params)=>promise.then((conn)=>processQuery(conn,{},templateParts,params));
  promise.queryStream = (templateParts, ...params)=>promise.then((conn)=>processQuery(conn,{stream:true},templateParts,params));
  promises[key] = promise;
  return promise;
};


//close a specific connection, if no options specified, deletes all connections
function closeConnection(options) {
  //no options, close/delete all connection references
  if (!options) return R.forEach( (conn)=>conn.close(), R.props(R.keys(connections), connections));

  //either a connection promise, or a connection
  if (options._mssqlngKey) {
    return connections[options._mssqlngKey] && connections[options._mssqlngKey].close();
  }

  //match against connection options
  var key = stringify(options || {});
  if (connections[key]) connections[key].close();
}


//handle the establishment of the connection
function handleConnection(resolve,reject,key,connection,err) {
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


//shadow the close method, so that it will clear itself from the pool
function shadowClose(connection) {
  var close = connection.close;
  connection.close = function(...args) {
    try {
      //close original connection
      close.apply(connection,args);

      //remove references
      delete promises[key];
      delete connections[key];
      delete connection;
      delete close;
    } catch(err) {}
  }
}