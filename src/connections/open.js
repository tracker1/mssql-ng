var Promise = require('i-promise');
var mssql = require('mssql');
var stringify = require('json-stable-stringify');
let clone = require('safe-clone-deep');
let shadowClose = require('./shadow-close');
let query = require('../query');
let assign = require('../util/assign');
let {connections,promises} = require('../cache');
let debug = require('debug')('mssql-ng');

module.exports = getConnection;


//gets/uses a pooled connection against the options specified
function getConnection(options) {
  debug('getConnection','start',options);

  let key = null;
  let promise = null;
  try {
    //clone options
    options = clone(options);

    //serialize the options as a key for pools
    key = stringify(options || {});

    //if there's already a promise for the given connection, return it
    if (promises[key]) return promises[key];

    //create a new promise for the given connection options
    promise = promises[key] = createConnectionPromise(key, options);

    debug('getConnection','success')
    return promise;
  } catch(err) {
    debug('getConnection','error',err);
    return Promise.reject(err);
  }
};


//creates a promise that will resolve/reject an mssql connection for the options
function createConnectionPromise(key, options) {
  
  debug('createConnectionPromise','start');

  //create promise that resolves to a connection
  var promise = new Promise((resolve,reject)=>{
    //create a new mssql connection
    let connection = new mssql.Connection(options,(err)=>handleConnectionCallback(err, resolve, reject, key, connection));
    connection.close = ()=>promise.then((conn)=>conn.close()).catch(()=>{ delete promises[key]; delete connections[key] });
    connection.query = (templateParts, ...params)=>promise.then((conn)=>query(conn,{},templateParts,params));
    connection.queryStream = (templateParts, ...params)=>promise.then((conn)=>query(conn,{stream:true},templateParts,params));
    connection.output = require('../parameters/output');
    connection.input = require('../parameters/input');

    debug('createConnectionPromise','success');
  });

  //add mssql types to promise - convenience access
  assign(promise, mssql.TYPES); //add mssql types to promise being returned
  promise.MAX = mssql.MAX;
  
  //back reference to cache
  promise._mssqlngKey = key;

  //extended methods
  promise.close = ()=>promise.then((conn)=>conn.close()).catch(()=>{ delete promises[key]; delete connections[key] });
  promise.query = (templateParts, ...params)=>promise.then((conn)=>query(conn,{},templateParts,params));
  promise.queryStream = (templateParts, ...params)=>promise.then((conn)=>query(conn,{stream:true},templateParts,params));
  promise.output = require('../parameters/output');
  promise.input = require('../parameters/input');

  debug('createConnectionPromise','success');
  return promise;
}


//handle promise resolution for connection callback
function handleConnectionCallback(err, resolve, reject, key, connection) {
  debug('handleConnectionCallback','start');

  //error, remove cached entry, reject the promise
  if (err) {
    debug('handleConnectionCallback','error',err);
    delete promises[key];
    return reject(err);
  }

  //patch close method for caching
  shadowClose(connection);

  //create a reference to the original connection for cleanup
  connection._mssqlngKey = key;

  //add connection to the pool
  connections[connection._mssqlngKey] = connection;

  //resolve the promise
  debug('handleConnectionCallback','success');
  return resolve(connection);
}