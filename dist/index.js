"use strict";

require("cc-globals");

var Promise = require("i-promise");
var mssql = require("mssql");
var stringify = require("json-stable-stringify");
var clone = require("safe-clone-deep");
var processQuery = require("process-query");
var promises = {}; //promises for connections
var connections = {}; //connections

//main export function
module.exports = getConnection;

//clone mssql
R.forEach(function (prop) {
  return module.exports[prop] = mssql[prop];
}, R.keys(mssql));

//replace close method with this module's close method
module.exports.close = closeConnection;

//gets/uses a pooled connection against the options specified
function getConnection(options) {
  //clone options
  options = clone(options);

  //serialize the options as a key for pools
  var key = stringify(options || {});

  //if there's already a promise for the given connection, return it
  if (promises[key]) {
    return promises[key];
  } //create a new promise for the given connection options
  var promise = new Promise(function (resolve, reject) {
    //create a new mssql connection
    var connection = new mssql.Connection(options, function (err) {
      return handleConnection(resolve, reject, key, connection, err);
    });
  });

  //patch promise
  promise._mssqlngKey = key;
  promise.close = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return promise.then(function (conn) {
      return conn.close();
    });
  };
  promise.query = function (templateParts) {
    for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }

    return promise.then(function (conn) {
      return processQuery(conn, {}, templateParts, params);
    });
  };
  promise.queryStream = function (templateParts) {
    for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }

    return promise.then(function (conn) {
      return processQuery(conn, { stream: true }, templateParts, params);
    });
  };
  promises[key] = promise;
  return promise;
};

//close a specific connection, if no options specified, deletes all connections
function closeConnection(options) {
  //no options, close/delete all connection references
  if (!options) {
    return R.forEach(function (conn) {
      return conn.close();
    }, R.props(R.keys(connections), connections));
  } //either a connection promise, or a connection
  if (options._mssqlngKey) {
    return connections[options._mssqlngKey] && connections[options._mssqlngKey].close();
  }

  //match against connection options
  var key = stringify(options || {});
  if (connections[key]) connections[key].close();
}

//handle the establishment of the connection
function handleConnection(resolve, reject, key, connection, err) {
  //error, remove cached entry, reject the promise
  if (err) {
    delete promises[key];
    return reject(err);
  }

  //handle close requests
  shadowClose(connection);

  //create a reference to the original connection for cleanup
  connection._mssqlngKey = key;
  connections[key] = connection;

  //resolve the promise
  return resolve(connection);
}

//shadow the close method, so that it will clear itself from the pool
function shadowClose(connection) {
  var close = connection.close;
  connection.close = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    try {
      //close original connection
      close.apply(connection, args);

      //remove references
      delete promises[key];
      delete connections[key];
      connection.close = function () {
        return null;
      };
    } catch (err) {}
  };
}
//# sourceMappingURL=data:application/json;base64,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LGFBQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3hCLGdCQUFVLENBQUMsS0FBSyxHQUFHO2VBQUksSUFBSTtPQUFBLENBQUM7S0FDN0IsQ0FBQyxPQUFNLEdBQUcsRUFBRSxFQUFFO0dBQ2hCLENBQUE7Q0FDRiIsImZpbGUiOiJzcmMvaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJyZXF1aXJlKCdjYy1nbG9iYWxzJyk7XG5cbnZhciBQcm9taXNlID0gcmVxdWlyZSgnaS1wcm9taXNlJyk7XG52YXIgbXNzcWwgPSByZXF1aXJlKCdtc3NxbCcpO1xudmFyIHN0cmluZ2lmeSA9IHJlcXVpcmUoJ2pzb24tc3RhYmxlLXN0cmluZ2lmeScpO1xudmFyIGNsb25lID0gcmVxdWlyZSgnc2FmZS1jbG9uZS1kZWVwJyk7XG52YXIgcHJvY2Vzc1F1ZXJ5ID0gcmVxdWlyZSgncHJvY2Vzcy1xdWVyeScpO1xudmFyIHByb21pc2VzID0ge307IC8vcHJvbWlzZXMgZm9yIGNvbm5lY3Rpb25zXG52YXIgY29ubmVjdGlvbnMgPSB7fTsgLy9jb25uZWN0aW9uc1xuXG5cbi8vbWFpbiBleHBvcnQgZnVuY3Rpb25cbm1vZHVsZS5leHBvcnRzID0gZ2V0Q29ubmVjdGlvbjtcblxuLy9jbG9uZSBtc3NxbFxuUi5mb3JFYWNoKChwcm9wKT0+bW9kdWxlLmV4cG9ydHNbcHJvcF0gPSBtc3NxbFtwcm9wXSwgUi5rZXlzKG1zc3FsKSk7XG5cbi8vcmVwbGFjZSBjbG9zZSBtZXRob2Qgd2l0aCB0aGlzIG1vZHVsZSdzIGNsb3NlIG1ldGhvZFxubW9kdWxlLmV4cG9ydHMuY2xvc2UgPSBjbG9zZUNvbm5lY3Rpb247XG5cblxuLy9nZXRzL3VzZXMgYSBwb29sZWQgY29ubmVjdGlvbiBhZ2FpbnN0IHRoZSBvcHRpb25zIHNwZWNpZmllZFxuZnVuY3Rpb24gZ2V0Q29ubmVjdGlvbihvcHRpb25zKSB7XG4gIC8vY2xvbmUgb3B0aW9uc1xuICBvcHRpb25zID0gY2xvbmUob3B0aW9ucyk7XG5cbiAgLy9zZXJpYWxpemUgdGhlIG9wdGlvbnMgYXMgYSBrZXkgZm9yIHBvb2xzXG4gIHZhciBrZXkgPSBzdHJpbmdpZnkob3B0aW9ucyB8fCB7fSk7XG5cbiAgLy9pZiB0aGVyZSdzIGFscmVhZHkgYSBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gY29ubmVjdGlvbiwgcmV0dXJuIGl0XG4gIGlmIChwcm9taXNlc1trZXldKSByZXR1cm4gcHJvbWlzZXNba2V5XTtcblxuICAvL2NyZWF0ZSBhIG5ldyBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gY29ubmVjdGlvbiBvcHRpb25zXG4gIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSxyZWplY3Qpe1xuICAgIC8vY3JlYXRlIGEgbmV3IG1zc3FsIGNvbm5lY3Rpb25cbiAgICB2YXIgY29ubmVjdGlvbiA9IG5ldyBtc3NxbC5Db25uZWN0aW9uKG9wdGlvbnMsKGVycik9PmhhbmRsZUNvbm5lY3Rpb24ocmVzb2x2ZSxyZWplY3Qsa2V5LGNvbm5lY3Rpb24sZXJyKSk7XG4gIH0pO1xuXG4gIC8vcGF0Y2ggcHJvbWlzZVxuICBwcm9taXNlLl9tc3NxbG5nS2V5ID0ga2V5O1xuICBwcm9taXNlLmNsb3NlID0gKC4uLmFyZ3MpPT5wcm9taXNlLnRoZW4oKGNvbm4pPT5jb25uLmNsb3NlKCkpO1xuICBwcm9taXNlLnF1ZXJ5ID0gKHRlbXBsYXRlUGFydHMsIC4uLnBhcmFtcyk9PnByb21pc2UudGhlbigoY29ubik9PnByb2Nlc3NRdWVyeShjb25uLHt9LHRlbXBsYXRlUGFydHMscGFyYW1zKSk7XG4gIHByb21pc2UucXVlcnlTdHJlYW0gPSAodGVtcGxhdGVQYXJ0cywgLi4ucGFyYW1zKT0+cHJvbWlzZS50aGVuKChjb25uKT0+cHJvY2Vzc1F1ZXJ5KGNvbm4se3N0cmVhbTp0cnVlfSx0ZW1wbGF0ZVBhcnRzLHBhcmFtcykpO1xuICBwcm9taXNlc1trZXldID0gcHJvbWlzZTtcbiAgcmV0dXJuIHByb21pc2U7XG59O1xuXG5cbi8vY2xvc2UgYSBzcGVjaWZpYyBjb25uZWN0aW9uLCBpZiBubyBvcHRpb25zIHNwZWNpZmllZCwgZGVsZXRlcyBhbGwgY29ubmVjdGlvbnNcbmZ1bmN0aW9uIGNsb3NlQ29ubmVjdGlvbihvcHRpb25zKSB7XG4gIC8vbm8gb3B0aW9ucywgY2xvc2UvZGVsZXRlIGFsbCBjb25uZWN0aW9uIHJlZmVyZW5jZXNcbiAgaWYgKCFvcHRpb25zKSByZXR1cm4gUi5mb3JFYWNoKCAoY29ubik9PmNvbm4uY2xvc2UoKSwgUi5wcm9wcyhSLmtleXMoY29ubmVjdGlvbnMpLCBjb25uZWN0aW9ucykpO1xuXG4gIC8vZWl0aGVyIGEgY29ubmVjdGlvbiBwcm9taXNlLCBvciBhIGNvbm5lY3Rpb25cbiAgaWYgKG9wdGlvbnMuX21zc3FsbmdLZXkpIHtcbiAgICByZXR1cm4gY29ubmVjdGlvbnNbb3B0aW9ucy5fbXNzcWxuZ0tleV0gJiYgY29ubmVjdGlvbnNbb3B0aW9ucy5fbXNzcWxuZ0tleV0uY2xvc2UoKTtcbiAgfVxuXG4gIC8vbWF0Y2ggYWdhaW5zdCBjb25uZWN0aW9uIG9wdGlvbnNcbiAgdmFyIGtleSA9IHN0cmluZ2lmeShvcHRpb25zIHx8IHt9KTtcbiAgaWYgKGNvbm5lY3Rpb25zW2tleV0pIGNvbm5lY3Rpb25zW2tleV0uY2xvc2UoKTtcbn1cblxuXG4vL2hhbmRsZSB0aGUgZXN0YWJsaXNobWVudCBvZiB0aGUgY29ubmVjdGlvblxuZnVuY3Rpb24gaGFuZGxlQ29ubmVjdGlvbihyZXNvbHZlLHJlamVjdCxrZXksY29ubmVjdGlvbixlcnIpIHtcbiAgLy9lcnJvciwgcmVtb3ZlIGNhY2hlZCBlbnRyeSwgcmVqZWN0IHRoZSBwcm9taXNlXG4gIGlmIChlcnIpIHtcbiAgICBkZWxldGUgcHJvbWlzZXNba2V5XTtcbiAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gIH1cblxuICAvL2hhbmRsZSBjbG9zZSByZXF1ZXN0c1xuICBzaGFkb3dDbG9zZShjb25uZWN0aW9uKTtcblxuICAvL2NyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgb3JpZ2luYWwgY29ubmVjdGlvbiBmb3IgY2xlYW51cFxuICBjb25uZWN0aW9uLl9tc3NxbG5nS2V5ID0ga2V5O1xuICBjb25uZWN0aW9uc1trZXldID0gY29ubmVjdGlvbjtcblxuICAvL3Jlc29sdmUgdGhlIHByb21pc2VcbiAgcmV0dXJuIHJlc29sdmUoY29ubmVjdGlvbik7XG59XG5cblxuLy9zaGFkb3cgdGhlIGNsb3NlIG1ldGhvZCwgc28gdGhhdCBpdCB3aWxsIGNsZWFyIGl0c2VsZiBmcm9tIHRoZSBwb29sXG5mdW5jdGlvbiBzaGFkb3dDbG9zZShjb25uZWN0aW9uKSB7XG4gIHZhciBjbG9zZSA9IGNvbm5lY3Rpb24uY2xvc2U7XG4gIGNvbm5lY3Rpb24uY2xvc2UgPSBmdW5jdGlvbiguLi5hcmdzKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vY2xvc2Ugb3JpZ2luYWwgY29ubmVjdGlvblxuICAgICAgY2xvc2UuYXBwbHkoY29ubmVjdGlvbixhcmdzKTtcblxuICAgICAgLy9yZW1vdmUgcmVmZXJlbmNlc1xuICAgICAgZGVsZXRlIHByb21pc2VzW2tleV07XG4gICAgICBkZWxldGUgY29ubmVjdGlvbnNba2V5XTtcbiAgICAgIGNvbm5lY3Rpb24uY2xvc2UgPSAoKT0+bnVsbDtcbiAgICB9IGNhdGNoKGVycikge31cbiAgfVxufSJdfQ==