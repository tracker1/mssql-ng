require('cc-globals');

var Promise = require('i-promise');
var promises = {}; //promises for connections
var connections = {}; //connections
var closeConnection = require('./connections/close');
var getConnection = require('./connections/open')


//main export function
module.exports = (options)=>getConnection(promises,connections,options);

//clone mssql
R.forEach((prop)=>module.exports[prop] = mssql[prop], R.keys(mssql));

//replace close method with this module's close method
module.exports.close = (options)=>closeConnection(connections,options);
module.exports.out = require('./parameters/output');
module.exports.in = require('./parameters/input');
