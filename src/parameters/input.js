let debug = require('debug')('mssql-ng');
module.exports = handleInputParam;

function handleInputParam(name, type, value) {
  //debug('handleOutputParam','begin',name,type,value);
  return function(request, index) {
    try {
      //debug('handleOutputParam','resolve',request.parameters,name,index);
      request.input(name, type, value);
      debug('handleOutputParam','resolved',request.parameters,name,index);
      return name;
    } catch(err) {
      debug('handleOutputParam','resolve-error', err);
    }
  };
}