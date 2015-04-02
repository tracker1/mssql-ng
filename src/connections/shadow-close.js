let {connections,promises} = require('../cache');

module.exports = shadowClose;

//shadow the close method, so that it will clear itself from the pool
function shadowClose(connection) {
  let close = connection.close;
  connection.close = function(...args) {
    //remove references
    delete promises[key];
    delete connections[key];

    try {
      //close original connection
      close.apply(connection,args);
    } catch(err) {}

    //clear local references - allow GC
    close = null;
    connection - null;
  }
}