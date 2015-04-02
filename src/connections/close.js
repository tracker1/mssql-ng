require('cc-globals');

let {connections,promises} = require('../cache');

module.exports = closeConnection;

//close a specific connection, if no options specified, deletes all connections
function closeConnection(options) {
  //no options, close/delete all connection references
  if (!options) {
    try {
      mssql.close();
    } catch(err){}

    //create list to track items to close
    let closeList = [];

    //iterate through each connection
    for (let key in connections) {
      //if there's a close method (connection match), add it to the list
      if (connections[key] && typeof connections[key].close === 'function') closeList.push(connections[key]);
    }

    //iterate through list and close each connection
    closeList.forEach((conn)=>conn.close());
  }

  //either a connection promise, or a connection
  if (options._mssqlngKey && typeof options.close === 'function') return options.close();

  //match against connection options
  let key = stringify(options || {});
  if (connections[key]) connections[key].close();
  if (promises[key]) promises[key].then((conn)=>conn.close()).catch(()=>{ delete promises[key]; delete connections[key] });
}
