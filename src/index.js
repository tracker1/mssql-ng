//base mssql package
var mssql = require('mssql');


//main export function - get a connection promise
module.exports = require('./connections/open');

//clone mssql
for (let prop in mssql) {
  if (mssql.hasOwnProperty(prop)) module.exports[prop] = mssql[prop];
}

//replace close method with this module's close method
module.exports.close = require('./connections/close');

//add in/out parameter utilities to exports
module.exports.out = require('./parameters/output');
module.exports.in = require('./parameters/input');
