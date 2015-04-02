var Promise = require('i-promise');
var mssql = require('mssql');
var stringify = require('json-stable-stringify');
let clone = require('safe-clone-deep');
let shadowClose = require('./shadow-close');
let query = require('../query');

let {connections,promises} = require('../cache');

module.exports = getConnection;

//gets/uses a pooled connection against the options specified
function getConnection(options) {
  //clone options
  options = clone(options);

  //serialize the options as a key for pools
  let key = stringify(options || {});

  //if there's already a promise for the given connection, return it
  if (promises[key]) return promises[key];

  //create a new promise for the given connection options
  let promise = new Promise(function(resolve,reject){

    //create a new mssql connection
    let connection = new mssql.Connection(options,(err)=>{
      //error, remove cached entry, reject the promise
      if (err) {
        delete promises[key];
        return reject(err);
      }

      //resolve the promise
      return resolve(connection);
    });

    //handle close requests
    shadowClose(connection);

    let shadowClose = require('./connections/shadow-close');

    //create a reference to the original connection for cleanup
    connection._mssqlngKey = key;

    //add connection to the pool
    connections[connection._mssqlngKey] = connection;

  });

  //patch promise
  promise._mssqlngKey = key;
  promise.close = ()=>promise.then((conn)=>conn.close());
  promise.query = (templateParts, ...params)=>promise.then((conn)=>query(conn,{},templateParts,params));
  promise.queryStream = (templateParts, ...params)=>promise.then((conn)=>query(conn,{stream:true},templateParts,params));
  promises[key] = promise;
  return promise;
};
