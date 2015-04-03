//base mssql package
let mssql = require('mssql');
let assign = require('./util/assign');

//main export function - get a connection promise, extended with mssql properties/methods
module.exports = assign(require('./connections/open'), mssql);

//replace close method with this module's close method
module.exports.close = require('./connections/close');

//add in/out parameter utilities to exports
module.exports.output = require('./parameters/output');
module.exports.input = require('./parameters/input');
