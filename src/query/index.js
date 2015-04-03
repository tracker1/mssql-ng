let Promise = require('i-promise');
let mssql = require('mssql');
let clone = require('safe-clone-deep');
let cleanParameter = require('./clean-parameter');
let debug = require('debug')('mssql-ng');

module.exports = processQuery;

function processQuery(connection,options,templateParts,params){

  debug('processQuery','begin',options,templateParts,params);

  let request = new mssql.Request(connection);
  let query = templateParts[0]; //add first part, subsequent parts added inline
  let paramName;

  request.stream = !!(options && options.stream);

  for (let i=0; i<params.length; i++) {
    paramName = addParam(request, i, params[i]);
    debug('added param', paramName);
    query += '@' + paramName + templateParts[i+1];        
  }

  //streaming request, resolve request
  if (request.stream) {
    debug('processQuery','resolve stream',query,request);
    request.query(query);
    return Promise.resolve(request);
  }

  //recordset request, return promise for result
  debug('processQuery','resolve promise',query,request);
  return new Promise(function(resolve,reject){
    request.query(query,function(err,recordset){
      debug('processQuery','resolved query',err,recordset);

      //error processing query, reject promise
      if (err) return reject(err);

      //query successful, resolve promise
      return resolve({
        parameters: request.parameters
        ,recordset: recordset || []
      });
    });
  });

};





function addParam(request, index, param) {
  debug('addParam','begin', index);

  let paramName = null;

  //param is method, call it with request/index - should return it's own parameter name
  if (typeof param === 'function') {
    paramName = param(request,index);
    debug('addParam', 'resolved', paramName);
    return paramName;
  }

  paramName = 'mssqlng_param_' + index.toString();

  //iife - allows for fast return from evaluation
  let clean = cleanParameter(param);
  debug('addParam', 'add input', paramName, clean[0], clean[1]);
  request.input(paramName, clean[0], clean[1]);

  //return parameter name used;
  return paramName;
}

