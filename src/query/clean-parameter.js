var mssql = require('mssql');
var debug = require('debug')('mssql-ng');

module.exports = cleanParameter;

function cleanParameter(value) {
  debug('cleanParameter','begin',value, typeof value);

  //null or empty
  if (value === null || typeof value === 'undefined') return [mssql.Bit, null];

  switch (typeof value) {
    case 'boolean': 
      return [mssql.Bit, value];

    case 'number':
      //if 32-bit integer, use integer
      if (~~value === value) return [mssql.Int, value];

      //64-bit integer
      if (Math.floor(value) === Math.ceil(value)) [mssql.BigInt, value];

      //use float - closest match, note, bignum should match out
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
  }
  //no match, nullify - shouldn't happen
  return [mssql.Bit, null];
}