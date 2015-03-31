var Promise = require('i-promise');
var mssql = require('mssql');
var clone = require('safe-clone-deep');

module.exports = processQuery;
module.exports.handleOutputParam = handleOutputParam;

function processQuery(connectionPromise,options,templateParts,...params){
  return connectionPromise
    .then(function(conn){
      var request = new mssql.Request(conn);
      var query = templateParts[0]; //add first part, subsequent parts added inline
      var param;

      request.stream = !!(options && options.stream);

      for (var i=0; i<params.length; i++) {
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


function handleOutputParam(parameterName, type) {
  return (request, index) => {
    request.output(parameterName, type);
  }
}


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

function cleanParameter(value) {
  //null or empty
  if (value === null || typeof value === 'undefined') return [mssql.Bit, null];

  switch (typeof value) {
    case 'boolean': 
      return [mssql.Bit, value];

    case 'number':
      //if 32-bit integer, use integer
      if (~~value === value) return [mssql.Int, value];

      if (Math.floor(value) === Math.ceil(value)) [mssql.BigInt, value];

      //use float
      return request.input(valueName, mssql.Float, value);

    case 'object':
      //date
      if (typeof value.toISOString === 'function') return [mssql.DateTimeOffset, value.toISOString()];

      //buffer
      if (Buffer.isBuffer(value)) return [mssql.VarBinary(value.length <= 8000 ? value.length : mssql.MAX), value];

      //WARNING: INTENTIONAL FALL-THROUGH
      //fall-through with string
      value = JSON.stringify(clone(value));

    case 'string':
      value = value.trim(); //trim string

      //uuid
      if (/^\{?[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}‌​\}?$/.test(value)) return [mssql.UniqueIdentifier, value.replace(/[\{\}]/g,'')];

      //other strings
      return [mssql.NVarChar(value.length <= 8000 ? value.legth : mssql.MAX), value];

    default: //nullify
      return [mssql.Bit, null];
}