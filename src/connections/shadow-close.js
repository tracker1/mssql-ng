let debug = require('debug')('mssql-ng')
let {connections,promises} = require('../cache');

module.exports = shadowClose;

//shadow the close method, so that it will clear itself from the pool
function shadowClose(connection) {
  debug('shadowClose', 'start');

  let close = connection.close;
  connection.close = function() {
    debug('connection.close','start');
    //remove references
    delete promises[connection._mssqlngKey];
    delete connections[connection._mssqlngKey];

    //close original connection
    setImmediate(()=>{
      try {
        debug('connection.close','apply');
        close.apply(connection);
        debug('connection.close','applied');
        //clear local references - allow GC
        close = null;
        connection - null;
      }catch(err){}
    });

    debug('connection.close','end');
  }
}