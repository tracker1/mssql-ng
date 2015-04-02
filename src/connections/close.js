require('cc-globals');

let {connections,promises} = require('../cache');

module.exports = closeConnection;

//close a specific connection, if no options specified, deletes all connections
function closeConnection(options) {
  //no options, close/delete all connection references
  if (!options) {
    let closeList = [];
    for (var key in connections) {
      if (typeof connections[key].close === 'function') closeList.push(connections[key]);
    }
    closeList.forEach((conn)=>conn.close());
  }

  //either a connection promise, or a connection
  if (options._mssqlngKey) {
    return connections[options._mssqlngKey] && connections[options._mssqlngKey].close();
  }

  //match against connection options
  let key = stringify(options || {});
  if (connections[key]) connections[key].close();
  if (promises[key]) promises[key].then((conn)=>conn.close()).catch(()=>{ delete promises[key]; delete connections[key] });
}
