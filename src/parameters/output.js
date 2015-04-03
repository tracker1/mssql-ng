let debug = require('debug')('mssql-ng');
module.exports = handleOutputParam;

function handleOutputParam(name, type, value) {
  //debug('handleOutputParam','begin',name,type,value);
  return function(request, index) {
    try {
      //debug('handleOutputParam','resolve',request.parameters,name,index);
      request.output(name, type, value);
      debug('handleOutputParam','resolved',name);
      return name;
    } catch(err) {
      debug('handleOutputParam','resolve-error', err);
    }
  };
}