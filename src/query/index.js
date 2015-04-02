let Promise = require('i-promise');
let mssql = require('mssql');
let clone = require('safe-clone-deep');
let cleanParameter = require('./clean-parameter');

module.exports = processQuery;

function processQuery(connectionPromise,options,templateParts,params){
  return connectionPromise
    .then(function(conn){
      let request = new mssql.Request(conn);
      let query = templateParts[0]; //add first part, subsequent parts added inline
      let param;

      request.stream = !!(options && options.stream);

      for (let i=0; i<params.length; i++) {
        paramName = addParam(request, i, params[i]);
        query += '@' + paramName + templateParts[i+1];        
      }

      //streaming request, resolve request
      if (request.stream) {
        request.query(query);
        return Promise.resolve(request);
      }

      //recordset request, return promise for result
      return new Promise(function(resolve,reject){
        request.query(query,function(err,recordset){
          //error processing query, reject promise
          if (err) return reject(err);

          //query successful, resolve promise
          return resolve({
            parameters: request.parameters
            ,recordset: recordset || []
          });
        });
      });
      
    });
};





function addParam(request, index, param) {
  //param is method, call it with request/index - should return it's own parameter name
  if (typeof param === 'function') return param(request,index);

  var paramName = 'mssqlng_param_' + index.toString();
  request.input(paramName, param);

  //iife - allows for fast return from evaluation
  var clean = cleanParameter(param);
  return request.input(paramName, clean[0], clean[1]);

  //return parameter name used;
  return paramName;
}

