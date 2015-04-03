var debug = require('debug')('mssql-ng')

//note: has the side effect of modifying the original base object
module.exports = function assign(base, ext) {
  debug('assign', base, ext);

  //nothing to add on to - return extension object
  if (!base) return ext;

  //extension must be an object
  if (!(ext && typeof ext.hasOwnProperty === 'function')) return base;

  //check each key, and add onto the base
  for (var key in ext) {
    //wrap in try block in case of sealed property
    try {
      if (ext.hasOwnProperty(key)) base[key] = ext[key];
    } catch(err) {
      //skip sealed property
    }
  }

  //return modified base (chaining/assignment friendly)
  return base;
};