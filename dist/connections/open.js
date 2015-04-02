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

module.exports = getConnection;

//gets/uses a pooled connection against the options specified
function getConnection(options) {
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
    promise = createConnectionPromise(options);

    //patch promise with mssql-ng methods
    promise._mssqlngKey = key;
    promise.close = function () {
      return promise.then(function (conn) {
        return conn.close();
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
    return promise;
  } catch (err) {
    return Promise.reject(err);
  }
};

//creates a promise that will resolve/reject an mssql connection for the options
function createConnectionPromise(options) {
  return new Promise(function (resolve, reject) {
    //create a new mssql connection
    var connection = new mssql.Connection(options, function (err) {
      return handleConnectionCallback(err, resolve, reject);
    });

    //patch close method for caching
    shadowClose(connection);

    //create a reference to the original connection for cleanup
    connection._mssqlngKey = key;

    //add connection to the pool
    connections[connection._mssqlngKey] = connection;
  });
}

//handle promise resolution for connection callback
function handleConnectionCallback(err, resolve, reject) {
  //error, remove cached entry, reject the promise
  if (err) {
    delete promises[key];
    return reject(err);
  }

  //resolve the promise
  return resolve(connection);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25uZWN0aW9ucy9vcGVuLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ25DLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM3QixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNqRCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2QyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM1QyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O2VBQ0gsT0FBTyxDQUFDLFVBQVUsQ0FBQzs7SUFBM0MsV0FBVyxZQUFYLFdBQVc7SUFBQyxRQUFRLFlBQVIsUUFBUTs7QUFHekIsTUFBTSxDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUM7OztBQUkvQixTQUFTLGFBQWEsQ0FBQyxPQUFPLEVBQUU7QUFDOUIsTUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2YsTUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ25CLE1BQUk7O0FBRUYsV0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O0FBR3pCLE9BQUcsR0FBRyxTQUFTLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDOzs7QUFHL0IsUUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7OztBQUd4QyxXQUFPLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLENBQUM7OztBQUczQyxXQUFPLENBQUMsV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUMxQixXQUFPLENBQUMsS0FBSyxHQUFHO2FBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFDLElBQUk7ZUFBRyxJQUFJLENBQUMsS0FBSyxFQUFFO09BQUEsQ0FBQztLQUFBLENBQUM7QUFDdkQsV0FBTyxDQUFDLEtBQUssR0FBRyxVQUFDLGFBQWE7d0NBQUssTUFBTTtBQUFOLGNBQU07OzthQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsVUFBQyxJQUFJO2VBQUcsS0FBSyxDQUFDLElBQUksRUFBQyxFQUFFLEVBQUMsYUFBYSxFQUFDLE1BQU0sQ0FBQztPQUFBLENBQUM7S0FBQSxDQUFDO0FBQ3RHLFdBQU8sQ0FBQyxXQUFXLEdBQUcsVUFBQyxhQUFhO3dDQUFLLE1BQU07QUFBTixjQUFNOzs7YUFBRyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBSTtlQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUMsRUFBQyxNQUFNLEVBQUMsSUFBSSxFQUFDLEVBQUMsYUFBYSxFQUFDLE1BQU0sQ0FBQztPQUFBLENBQUM7S0FBQSxDQUFDO0FBQ3ZILFlBQVEsQ0FBQyxHQUFHLENBQUMsR0FBRyxPQUFPLENBQUM7QUFDeEIsV0FBTyxPQUFPLENBQUM7R0FDaEIsQ0FBQyxPQUFNLEdBQUcsRUFBRTtBQUNYLFdBQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUM1QjtDQUNGLENBQUM7OztBQUlGLFNBQVMsdUJBQXVCLENBQUMsT0FBTyxFQUFFO0FBQ3hDLFNBQU8sSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUMsTUFBTSxFQUFHOztBQUVuQyxRQUFJLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFDLFVBQUMsR0FBRzthQUFHLHdCQUF3QixDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUMsTUFBTSxDQUFDO0tBQUEsQ0FBQyxDQUFDOzs7QUFHcEcsZUFBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDOzs7QUFHeEIsY0FBVSxDQUFDLFdBQVcsR0FBRyxHQUFHLENBQUM7OztBQUc3QixlQUFXLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxHQUFHLFVBQVUsQ0FBQztHQUNsRCxDQUFDLENBQUM7Q0FDSjs7O0FBSUQsU0FBUyx3QkFBd0IsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRTs7QUFFdEQsTUFBSSxHQUFHLEVBQUU7QUFDUCxXQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNyQixXQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztHQUNwQjs7O0FBR0QsU0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7Q0FDNUIiLCJmaWxlIjoic3JjL2Nvbm5lY3Rpb25zL29wZW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgUHJvbWlzZSA9IHJlcXVpcmUoJ2ktcHJvbWlzZScpO1xudmFyIG1zc3FsID0gcmVxdWlyZSgnbXNzcWwnKTtcbnZhciBzdHJpbmdpZnkgPSByZXF1aXJlKCdqc29uLXN0YWJsZS1zdHJpbmdpZnknKTtcbmxldCBjbG9uZSA9IHJlcXVpcmUoJ3NhZmUtY2xvbmUtZGVlcCcpO1xubGV0IHNoYWRvd0Nsb3NlID0gcmVxdWlyZSgnLi9zaGFkb3ctY2xvc2UnKTtcbmxldCBxdWVyeSA9IHJlcXVpcmUoJy4uL3F1ZXJ5Jyk7XG5sZXQge2Nvbm5lY3Rpb25zLHByb21pc2VzfSA9IHJlcXVpcmUoJy4uL2NhY2hlJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRDb25uZWN0aW9uO1xuXG5cbi8vZ2V0cy91c2VzIGEgcG9vbGVkIGNvbm5lY3Rpb24gYWdhaW5zdCB0aGUgb3B0aW9ucyBzcGVjaWZpZWRcbmZ1bmN0aW9uIGdldENvbm5lY3Rpb24ob3B0aW9ucykge1xuICBsZXQga2V5ID0gbnVsbDtcbiAgbGV0IHByb21pc2UgPSBudWxsO1xuICB0cnkge1xuICAgIC8vY2xvbmUgb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBjbG9uZShvcHRpb25zKTtcblxuICAgIC8vc2VyaWFsaXplIHRoZSBvcHRpb25zIGFzIGEga2V5IGZvciBwb29sc1xuICAgIGtleSA9IHN0cmluZ2lmeShvcHRpb25zIHx8IHt9KTtcblxuICAgIC8vaWYgdGhlcmUncyBhbHJlYWR5IGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIGNvbm5lY3Rpb24sIHJldHVybiBpdFxuICAgIGlmIChwcm9taXNlc1trZXldKSByZXR1cm4gcHJvbWlzZXNba2V5XTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHByb21pc2UgZm9yIHRoZSBnaXZlbiBjb25uZWN0aW9uIG9wdGlvbnNcbiAgICBwcm9taXNlID0gY3JlYXRlQ29ubmVjdGlvblByb21pc2Uob3B0aW9ucyk7XG5cbiAgICAvL3BhdGNoIHByb21pc2Ugd2l0aCBtc3NxbC1uZyBtZXRob2RzXG4gICAgcHJvbWlzZS5fbXNzcWxuZ0tleSA9IGtleTtcbiAgICBwcm9taXNlLmNsb3NlID0gKCk9PnByb21pc2UudGhlbigoY29ubik9PmNvbm4uY2xvc2UoKSk7XG4gICAgcHJvbWlzZS5xdWVyeSA9ICh0ZW1wbGF0ZVBhcnRzLCAuLi5wYXJhbXMpPT5wcm9taXNlLnRoZW4oKGNvbm4pPT5xdWVyeShjb25uLHt9LHRlbXBsYXRlUGFydHMscGFyYW1zKSk7XG4gICAgcHJvbWlzZS5xdWVyeVN0cmVhbSA9ICh0ZW1wbGF0ZVBhcnRzLCAuLi5wYXJhbXMpPT5wcm9taXNlLnRoZW4oKGNvbm4pPT5xdWVyeShjb25uLHtzdHJlYW06dHJ1ZX0sdGVtcGxhdGVQYXJ0cyxwYXJhbXMpKTtcbiAgICBwcm9taXNlc1trZXldID0gcHJvbWlzZTtcbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfSBjYXRjaChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufTtcblxuXG4vL2NyZWF0ZXMgYSBwcm9taXNlIHRoYXQgd2lsbCByZXNvbHZlL3JlamVjdCBhbiBtc3NxbCBjb25uZWN0aW9uIGZvciB0aGUgb3B0aW9uc1xuZnVuY3Rpb24gY3JlYXRlQ29ubmVjdGlvblByb21pc2Uob3B0aW9ucykge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KT0+e1xuICAgIC8vY3JlYXRlIGEgbmV3IG1zc3FsIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbiA9IG5ldyBtc3NxbC5Db25uZWN0aW9uKG9wdGlvbnMsKGVycik9PmhhbmRsZUNvbm5lY3Rpb25DYWxsYmFjayhlcnIsIHJlc29sdmUscmVqZWN0KSk7XG5cbiAgICAvL3BhdGNoIGNsb3NlIG1ldGhvZCBmb3IgY2FjaGluZ1xuICAgIHNoYWRvd0Nsb3NlKGNvbm5lY3Rpb24pO1xuXG4gICAgLy9jcmVhdGUgYSByZWZlcmVuY2UgdG8gdGhlIG9yaWdpbmFsIGNvbm5lY3Rpb24gZm9yIGNsZWFudXBcbiAgICBjb25uZWN0aW9uLl9tc3NxbG5nS2V5ID0ga2V5O1xuXG4gICAgLy9hZGQgY29ubmVjdGlvbiB0byB0aGUgcG9vbFxuICAgIGNvbm5lY3Rpb25zW2Nvbm5lY3Rpb24uX21zc3FsbmdLZXldID0gY29ubmVjdGlvbjtcbiAgfSk7XG59XG5cblxuLy9oYW5kbGUgcHJvbWlzZSByZXNvbHV0aW9uIGZvciBjb25uZWN0aW9uIGNhbGxiYWNrXG5mdW5jdGlvbiBoYW5kbGVDb25uZWN0aW9uQ2FsbGJhY2soZXJyLCByZXNvbHZlLCByZWplY3QpIHtcbiAgLy9lcnJvciwgcmVtb3ZlIGNhY2hlZCBlbnRyeSwgcmVqZWN0IHRoZSBwcm9taXNlXG4gIGlmIChlcnIpIHtcbiAgICBkZWxldGUgcHJvbWlzZXNba2V5XTtcbiAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gIH1cblxuICAvL3Jlc29sdmUgdGhlIHByb21pc2VcbiAgcmV0dXJuIHJlc29sdmUoY29ubmVjdGlvbik7XG59Il19