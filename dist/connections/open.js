"use strict";

var Promise = require("i-promise");
var mssql = require("mssql");
var stringify = require("json-stable-stringify");
var clone = require("safe-clone-deep");
var shadowClose = require("./shadow-close");
var query = require("../query");

var _require = require("../cache");

var connections = _require.connections;
var promises = _require.promises;

var debug = require("debug")("mssql-ng");

module.exports = getConnection;

//gets/uses a pooled connection against the options specified
function getConnection(options) {
  debug("getConnection", "start", options);

  var key = null;
  var promise = null;
  try {
    //clone options
    options = clone(options);

    //serialize the options as a key for pools
    key = stringify(options || {});

    //if there's already a promise for the given connection, return it
    if (promises[key]) return promises[key];

    //create a new promise for the given connection options
    promise = createConnectionPromise(key, options);

    //patch promise with mssql-ng methods
    promise._mssqlngKey = key;
    promise.close = function () {
      return promise.then(function (conn) {
        return conn.close();
      })["catch"](function () {
        delete promises[key];delete connections[key];
      });
    };
    promise.query = function (templateParts) {
      for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        params[_key - 1] = arguments[_key];
      }

      return promise.then(function (conn) {
        return query(conn, {}, templateParts, params);
      });
    };
    promise.queryStream = function (templateParts) {
      for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        params[_key - 1] = arguments[_key];
      }

      return promise.then(function (conn) {
        return query(conn, { stream: true }, templateParts, params);
      });
    };
    promises[key] = promise;
    debug("getConnection", "success");
    return promise;
  } catch (err) {
    debug("getConnection", "error", err);
    return Promise.reject(err);
  }
};

//creates a promise that will resolve/reject an mssql connection for the options
function createConnectionPromise(key, options) {
  debug("createConnectionPromise", "start");
  return new Promise(function (resolve, reject) {
    //create a new mssql connection
    var connection = new mssql.Connection(options, function (err) {
      return handleConnectionCallback(err, resolve, reject, key, connection);
    });
    debug("createConnectionPromise", "success");
  });
}

//handle promise resolution for connection callback
function handleConnectionCallback(err, resolve, reject, key, connection) {
  debug("handleConnectionCallback", "start");

  //error, remove cached entry, reject the promise
  if (err) {
    debug("handleConnectionCallback", "error", err);
    delete promises[key];
    return reject(err);
  }

  //patch close method for caching
  shadowClose(connection);

  //create a reference to the original connection for cleanup
  connection._mssqlngKey = key;

  //add connection to the pool
  connections[connection._mssqlngKey] = connection;

  //resolve the promise
  debug("handleConnectionCallback", "success");
  return resolve(connection);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25uZWN0aW9ucy9vcGVuLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ25DLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM3QixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNqRCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2QyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM1QyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O2VBQ0gsT0FBTyxDQUFDLFVBQVUsQ0FBQzs7SUFBM0MsV0FBVyxZQUFYLFdBQVc7SUFBQyxRQUFRLFlBQVIsUUFBUTs7QUFDekIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUV6QyxNQUFNLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQzs7O0FBSS9CLFNBQVMsYUFBYSxDQUFDLE9BQU8sRUFBRTtBQUM5QixPQUFLLENBQUMsZUFBZSxFQUFDLE9BQU8sRUFBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdkMsTUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2YsTUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ25CLE1BQUk7O0FBRUYsV0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O0FBR3pCLE9BQUcsR0FBRyxTQUFTLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDOzs7QUFHL0IsUUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7OztBQUd4QyxXQUFPLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDOzs7QUFHaEQsV0FBTyxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7QUFDMUIsV0FBTyxDQUFDLEtBQUssR0FBRzthQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJO2VBQUcsSUFBSSxDQUFDLEtBQUssRUFBRTtPQUFBLENBQUMsU0FBTSxDQUFDLFlBQUk7QUFBRSxlQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxBQUFDLE9BQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO09BQUUsQ0FBQztLQUFBLENBQUM7QUFDcEgsV0FBTyxDQUFDLEtBQUssR0FBRyxVQUFDLGFBQWE7d0NBQUssTUFBTTtBQUFOLGNBQU07OzthQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJO2VBQUcsS0FBSyxDQUFDLElBQUksRUFBQyxFQUFFLEVBQUMsYUFBYSxFQUFDLE1BQU0sQ0FBQztPQUFBLENBQUM7S0FBQSxDQUFDO0FBQ3RHLFdBQU8sQ0FBQyxXQUFXLEdBQUcsVUFBQyxhQUFhO3dDQUFLLE1BQU07QUFBTixjQUFNOzs7YUFBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBSTtlQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUMsRUFBQyxNQUFNLEVBQUMsSUFBSSxFQUFDLEVBQUMsYUFBYSxFQUFDLE1BQU0sQ0FBQztPQUFBLENBQUM7S0FBQSxDQUFDO0FBQ3ZILFlBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUM7QUFDeEIsU0FBSyxDQUFDLGVBQWUsRUFBQyxTQUFTLENBQUMsQ0FBQTtBQUNoQyxXQUFPLE9BQU8sQ0FBQztHQUNoQixDQUFDLE9BQU0sR0FBRyxFQUFFO0FBQ1gsU0FBSyxDQUFDLGVBQWUsRUFBQyxPQUFPLEVBQUMsR0FBRyxDQUFDLENBQUM7QUFDbkMsV0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQzVCO0NBQ0YsQ0FBQzs7O0FBSUYsU0FBUyx1QkFBdUIsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFO0FBQzdDLE9BQUssQ0FBQyx5QkFBeUIsRUFBQyxPQUFPLENBQUMsQ0FBQztBQUN6QyxTQUFPLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTyxFQUFDLE1BQU0sRUFBRzs7QUFFbkMsUUFBSSxVQUFVLEdBQUcsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBQyxVQUFDLEdBQUc7YUFBRyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDO0tBQUEsQ0FBQyxDQUFDO0FBQ3RILFNBQUssQ0FBQyx5QkFBeUIsRUFBQyxTQUFTLENBQUMsQ0FBQztHQUM1QyxDQUFDLENBQUM7Q0FDSjs7O0FBSUQsU0FBUyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFO0FBQ3ZFLE9BQUssQ0FBQywwQkFBMEIsRUFBQyxPQUFPLENBQUMsQ0FBQzs7O0FBRzFDLE1BQUksR0FBRyxFQUFFO0FBQ1AsU0FBSyxDQUFDLDBCQUEwQixFQUFDLE9BQU8sRUFBQyxHQUFHLENBQUMsQ0FBQztBQUM5QyxXQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQixXQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNwQjs7O0FBR0QsYUFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDOzs7QUFHeEIsWUFBVSxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7OztBQUc3QixhQUFXLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFVBQVUsQ0FBQzs7O0FBR2pELE9BQUssQ0FBQywwQkFBMEIsRUFBQyxTQUFTLENBQUMsQ0FBQztBQUM1QyxTQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztDQUM1QiIsImZpbGUiOiJzcmMvY29ubmVjdGlvbnMvb3Blbi5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBQcm9taXNlID0gcmVxdWlyZSgnaS1wcm9taXNlJyk7XG52YXIgbXNzcWwgPSByZXF1aXJlKCdtc3NxbCcpO1xudmFyIHN0cmluZ2lmeSA9IHJlcXVpcmUoJ2pzb24tc3RhYmxlLXN0cmluZ2lmeScpO1xubGV0IGNsb25lID0gcmVxdWlyZSgnc2FmZS1jbG9uZS1kZWVwJyk7XG5sZXQgc2hhZG93Q2xvc2UgPSByZXF1aXJlKCcuL3NoYWRvdy1jbG9zZScpO1xubGV0IHF1ZXJ5ID0gcmVxdWlyZSgnLi4vcXVlcnknKTtcbmxldCB7Y29ubmVjdGlvbnMscHJvbWlzZXN9ID0gcmVxdWlyZSgnLi4vY2FjaGUnKTtcbmxldCBkZWJ1ZyA9IHJlcXVpcmUoJ2RlYnVnJykoJ21zc3FsLW5nJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZ2V0Q29ubmVjdGlvbjtcblxuXG4vL2dldHMvdXNlcyBhIHBvb2xlZCBjb25uZWN0aW9uIGFnYWluc3QgdGhlIG9wdGlvbnMgc3BlY2lmaWVkXG5mdW5jdGlvbiBnZXRDb25uZWN0aW9uKG9wdGlvbnMpIHtcbiAgZGVidWcoJ2dldENvbm5lY3Rpb24nLCdzdGFydCcsb3B0aW9ucyk7XG5cbiAgbGV0IGtleSA9IG51bGw7XG4gIGxldCBwcm9taXNlID0gbnVsbDtcbiAgdHJ5IHtcbiAgICAvL2Nsb25lIG9wdGlvbnNcbiAgICBvcHRpb25zID0gY2xvbmUob3B0aW9ucyk7XG5cbiAgICAvL3NlcmlhbGl6ZSB0aGUgb3B0aW9ucyBhcyBhIGtleSBmb3IgcG9vbHNcbiAgICBrZXkgPSBzdHJpbmdpZnkob3B0aW9ucyB8fCB7fSk7XG5cbiAgICAvL2lmIHRoZXJlJ3MgYWxyZWFkeSBhIHByb21pc2UgZm9yIHRoZSBnaXZlbiBjb25uZWN0aW9uLCByZXR1cm4gaXRcbiAgICBpZiAocHJvbWlzZXNba2V5XSkgcmV0dXJuIHByb21pc2VzW2tleV07XG5cbiAgICAvL2NyZWF0ZSBhIG5ldyBwcm9taXNlIGZvciB0aGUgZ2l2ZW4gY29ubmVjdGlvbiBvcHRpb25zXG4gICAgcHJvbWlzZSA9IGNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlKGtleSwgb3B0aW9ucyk7XG5cbiAgICAvL3BhdGNoIHByb21pc2Ugd2l0aCBtc3NxbC1uZyBtZXRob2RzXG4gICAgcHJvbWlzZS5fbXNzcWxuZ0tleSA9IGtleTtcbiAgICBwcm9taXNlLmNsb3NlID0gKCk9PnByb21pc2UudGhlbigoY29ubik9PmNvbm4uY2xvc2UoKSkuY2F0Y2goKCk9PnsgZGVsZXRlIHByb21pc2VzW2tleV07IGRlbGV0ZSBjb25uZWN0aW9uc1trZXldIH0pO1xuICAgIHByb21pc2UucXVlcnkgPSAodGVtcGxhdGVQYXJ0cywgLi4ucGFyYW1zKT0+cHJvbWlzZS50aGVuKChjb25uKT0+cXVlcnkoY29ubix7fSx0ZW1wbGF0ZVBhcnRzLHBhcmFtcykpO1xuICAgIHByb21pc2UucXVlcnlTdHJlYW0gPSAodGVtcGxhdGVQYXJ0cywgLi4ucGFyYW1zKT0+cHJvbWlzZS50aGVuKChjb25uKT0+cXVlcnkoY29ubix7c3RyZWFtOnRydWV9LHRlbXBsYXRlUGFydHMscGFyYW1zKSk7XG4gICAgcHJvbWlzZXNba2V5XSA9IHByb21pc2U7XG4gICAgZGVidWcoJ2dldENvbm5lY3Rpb24nLCdzdWNjZXNzJylcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSBjYXRjaChlcnIpIHtcbiAgICBkZWJ1ZygnZ2V0Q29ubmVjdGlvbicsJ2Vycm9yJyxlcnIpO1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59O1xuXG5cbi8vY3JlYXRlcyBhIHByb21pc2UgdGhhdCB3aWxsIHJlc29sdmUvcmVqZWN0IGFuIG1zc3FsIGNvbm5lY3Rpb24gZm9yIHRoZSBvcHRpb25zXG5mdW5jdGlvbiBjcmVhdGVDb25uZWN0aW9uUHJvbWlzZShrZXksIG9wdGlvbnMpIHtcbiAgZGVidWcoJ2NyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlJywnc3RhcnQnKTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLHJlamVjdCk9PntcbiAgICAvL2NyZWF0ZSBhIG5ldyBtc3NxbCBjb25uZWN0aW9uXG4gICAgbGV0IGNvbm5lY3Rpb24gPSBuZXcgbXNzcWwuQ29ubmVjdGlvbihvcHRpb25zLChlcnIpPT5oYW5kbGVDb25uZWN0aW9uQ2FsbGJhY2soZXJyLCByZXNvbHZlLCByZWplY3QsIGtleSwgY29ubmVjdGlvbikpO1xuICAgIGRlYnVnKCdjcmVhdGVDb25uZWN0aW9uUHJvbWlzZScsJ3N1Y2Nlc3MnKTtcbiAgfSk7XG59XG5cblxuLy9oYW5kbGUgcHJvbWlzZSByZXNvbHV0aW9uIGZvciBjb25uZWN0aW9uIGNhbGxiYWNrXG5mdW5jdGlvbiBoYW5kbGVDb25uZWN0aW9uQ2FsbGJhY2soZXJyLCByZXNvbHZlLCByZWplY3QsIGtleSwgY29ubmVjdGlvbikge1xuICBkZWJ1ZygnaGFuZGxlQ29ubmVjdGlvbkNhbGxiYWNrJywnc3RhcnQnKTtcblxuICAvL2Vycm9yLCByZW1vdmUgY2FjaGVkIGVudHJ5LCByZWplY3QgdGhlIHByb21pc2VcbiAgaWYgKGVycikge1xuICAgIGRlYnVnKCdoYW5kbGVDb25uZWN0aW9uQ2FsbGJhY2snLCdlcnJvcicsZXJyKTtcbiAgICBkZWxldGUgcHJvbWlzZXNba2V5XTtcbiAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gIH1cblxuICAvL3BhdGNoIGNsb3NlIG1ldGhvZCBmb3IgY2FjaGluZ1xuICBzaGFkb3dDbG9zZShjb25uZWN0aW9uKTtcblxuICAvL2NyZWF0ZSBhIHJlZmVyZW5jZSB0byB0aGUgb3JpZ2luYWwgY29ubmVjdGlvbiBmb3IgY2xlYW51cFxuICBjb25uZWN0aW9uLl9tc3NxbG5nS2V5ID0ga2V5O1xuXG4gIC8vYWRkIGNvbm5lY3Rpb24gdG8gdGhlIHBvb2xcbiAgY29ubmVjdGlvbnNbY29ubmVjdGlvbi5fbXNzcWxuZ0tleV0gPSBjb25uZWN0aW9uO1xuXG4gIC8vcmVzb2x2ZSB0aGUgcHJvbWlzZVxuICBkZWJ1ZygnaGFuZGxlQ29ubmVjdGlvbkNhbGxiYWNrJywnc3VjY2VzcycpO1xuICByZXR1cm4gcmVzb2x2ZShjb25uZWN0aW9uKTtcbn0iXX0=