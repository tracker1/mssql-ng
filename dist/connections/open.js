"use strict";

var Promise = require("i-promise");
var mssql = require("mssql");
var stringify = require("json-stable-stringify");
var clone = require("safe-clone-deep");
var shadowClose = require("./shadow-close");
var query = require("../query");
var assign = require("../util/assign");

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
    promise = promises[key] = createConnectionPromise(key, options);

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

  //create promise that resolves to a connection
  var promise = new Promise(function (resolve, reject) {
    //create a new mssql connection
    var connection = new mssql.Connection(options, function (err) {
      return handleConnectionCallback(err, resolve, reject, key, connection);
    });
    connection.close = function () {
      return promise.then(function (conn) {
        return conn.close();
      })["catch"](function () {
        delete promises[key];delete connections[key];
      });
    };
    connection.query = function (templateParts) {
      for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        params[_key - 1] = arguments[_key];
      }

      return promise.then(function (conn) {
        return query(conn, {}, templateParts, params);
      });
    };
    connection.queryStream = function (templateParts) {
      for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        params[_key - 1] = arguments[_key];
      }

      return promise.then(function (conn) {
        return query(conn, { stream: true }, templateParts, params);
      });
    };
    connection.output = require("../parameters/output");
    connection.input = require("../parameters/input");

    debug("createConnectionPromise", "success");
  });

  //add mssql types to promise - convenience access
  assign(promise, mssql.TYPES); //add mssql types to promise being returned
  promise.MAX = mssql.MAX;

  //back reference to cache
  promise._mssqlngKey = key;

  //extended methods
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
  promise.output = require("../parameters/output");
  promise.input = require("../parameters/input");

  debug("createConnectionPromise", "success");
  return promise;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25uZWN0aW9ucy9vcGVuLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ25DLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM3QixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQztBQUNqRCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN2QyxJQUFJLFdBQVcsR0FBRyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUM1QyxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDaEMsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7O2VBQ1YsT0FBTyxDQUFDLFVBQVUsQ0FBQzs7SUFBM0MsV0FBVyxZQUFYLFdBQVc7SUFBQyxRQUFRLFlBQVIsUUFBUTs7QUFDekIsSUFBSSxLQUFLLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztBQUV6QyxNQUFNLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQzs7O0FBSS9CLFNBQVMsYUFBYSxDQUFDLE9BQU8sRUFBRTtBQUM5QixPQUFLLENBQUMsZUFBZSxFQUFDLE9BQU8sRUFBQyxPQUFPLENBQUMsQ0FBQzs7QUFFdkMsTUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2YsTUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ25CLE1BQUk7O0FBRUYsV0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzs7O0FBR3pCLE9BQUcsR0FBRyxTQUFTLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDOzs7QUFHL0IsUUFBSSxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7OztB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b250ZW50IjpbInZhciBQcm9taXNlID0gcmVxdWlyZSgnaS1wcm9taXNlJyk7XG52YXIgbXNzcWwgPSByZXF1aXJlKCdtc3NxbCcpO1xudmFyIHN0cmluZ2lmeSA9IHJlcXVpcmUoJ2pzb24tc3RhYmxlLXN0cmluZ2lmeScpO1xubGV0IGNsb25lID0gcmVxdWlyZSgnc2FmZS1jbG9uZS1kZWVwJyk7XG5sZXQgc2hhZG93Q2xvc2UgPSByZXF1aXJlKCcuL3NoYWRvdy1jbG9zZScpO1xubGV0IHF1ZXJ5ID0gcmVxdWlyZSgnLi4vcXVlcnknKTtcbmxldCBhc3NpZ24gPSByZXF1aXJlKCcuLi91dGlsL2Fzc2lnbicpO1xubGV0IHtjb25uZWN0aW9ucyxwcm9taXNlc30gPSByZXF1aXJlKCcuLi9jYWNoZScpO1xubGV0IGRlYnVnID0gcmVxdWlyZSgnZGVidWcnKSgnbXNzcWwtbmcnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBnZXRDb25uZWN0aW9uO1xuXG5cbi8vZ2V0cy91c2VzIGEgcG9vbGVkIGNvbm5lY3Rpb24gYWdhaW5zdCB0aGUgb3B0aW9ucyBzcGVjaWZpZWRcbmZ1bmN0aW9uIGdldENvbm5lY3Rpb24ob3B0aW9ucykge1xuICBkZWJ1ZygnZ2V0Q29ubmVjdGlvbicsJ3N0YXJ0JyxvcHRpb25zKTtcblxuICBsZXQga2V5ID0gbnVsbDtcbiAgbGV0IHByb21pc2UgPSBudWxsO1xuICB0cnkge1xuICAgIC8vY2xvbmUgb3B0aW9uc1xuICAgIG9wdGlvbnMgPSBjbG9uZShvcHRpb25zKTtcblxuICAgIC8vc2VyaWFsaXplIHRoZSBvcHRpb25zIGFzIGEga2V5IGZvciBwb29sc1xuICAgIGtleSA9IHN0cmluZ2lmeShvcHRpb25zIHx8IHt9KTtcblxuICAgIC8vaWYgdGhlcmUncyBhbHJlYWR5IGEgcHJvbWlzZSBmb3IgdGhlIGdpdmVuIGNvbm5lY3Rpb24sIHJldHVybiBpdFxuICAgIGlmIChwcm9taXNlc1trZXldKSByZXR1cm4gcHJvbWlzZXNba2V5XTtcblxuICAgIC8vY3JlYXRlIGEgbmV3IHByb21pc2UgZm9yIHRoZSBnaXZlbiBjb25uZWN0aW9uIG9wdGlvbnNcbiAgICBwcm9taXNlID0gcHJvbWlzZXNba2V5XSA9IGNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlKGtleSwgb3B0aW9ucyk7XG5cbiAgICBkZWJ1ZygnZ2V0Q29ubmVjdGlvbicsJ3N1Y2Nlc3MnKVxuICAgIHJldHVybiBwcm9taXNlO1xuICB9IGNhdGNoKGVycikge1xuICAgIGRlYnVnKCdnZXRDb25uZWN0aW9uJywnZXJyb3InLGVycik7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn07XG5cblxuLy9jcmVhdGVzIGEgcHJvbWlzZSB0aGF0IHdpbGwgcmVzb2x2ZS9yZWplY3QgYW4gbXNzcWwgY29ubmVjdGlvbiBmb3IgdGhlIG9wdGlvbnNcbmZ1bmN0aW9uIGNyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlKGtleSwgb3B0aW9ucykge1xuICBcbiAgZGVidWcoJ2NyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlJywnc3RhcnQnKTtcblxuICAvL2NyZWF0ZSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgdG8gYSBjb25uZWN0aW9uXG4gIHZhciBwcm9taXNlID0gbmV3IFByb21pc2UoKHJlc29sdmUscmVqZWN0KT0+e1xuICAgIC8vY3JlYXRlIGEgbmV3IG1zc3FsIGNvbm5lY3Rpb25cbiAgICBsZXQgY29ubmVjdGlvbiA9IG5ldyBtc3NxbC5Db25uZWN0aW9uKG9wdGlvbnMsKGVycik9PmhhbmRsZUNvbm5lY3Rpb25DYWxsYmFjayhlcnIsIHJlc29sdmUsIHJlamVjdCwga2V5LCBjb25uZWN0aW9uKSk7XG4gICAgY29ubmVjdGlvbi5jbG9zZSA9ICgpPT5wcm9taXNlLnRoZW4oKGNvbm4pPT5jb25uLmNsb3NlKCkpLmNhdGNoKCgpPT57IGRlbGV0ZSBwcm9taXNlc1trZXldOyBkZWxldGUgY29ubmVjdGlvbnNba2V5XSB9KTtcbiAgICBjb25uZWN0aW9uLnF1ZXJ5ID0gKHRlbXBsYXRlUGFydHMsIC4uLnBhcmFtcyk9PnByb21pc2UudGhlbigoY29ubik9PnF1ZXJ5KGNvbm4se30sdGVtcGxhdGVQYXJ0cyxwYXJhbXMpKTtcbiAgICBjb25uZWN0aW9uLnF1ZXJ5U3RyZWFtID0gKHRlbXBsYXRlUGFydHMsIC4uLnBhcmFtcyk9PnByb21pc2UudGhlbigoY29ubik9PnF1ZXJ5KGNvbm4se3N0cmVhbTp0cnVlfSx0ZW1wbGF0ZVBhcnRzLHBhcmFtcykpO1xuICAgIGNvbm5lY3Rpb24ub3V0cHV0ID0gcmVxdWlyZSgnLi4vcGFyYW1ldGVycy9vdXRwdXQnKTtcbiAgICBjb25uZWN0aW9uLmlucHV0ID0gcmVxdWlyZSgnLi4vcGFyYW1ldGVycy9pbnB1dCcpO1xuXG4gICAgZGVidWcoJ2NyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlJywnc3VjY2VzcycpO1xuICB9KTtcblxuICAvL2FkZCBtc3NxbCB0eXBlcyB0byBwcm9taXNlIC0gY29udmVuaWVuY2UgYWNjZXNzXG4gIGFzc2lnbihwcm9taXNlLCBtc3NxbC5UWVBFUyk7IC8vYWRkIG1zc3FsIHR5cGVzIHRvIHByb21pc2UgYmVpbmcgcmV0dXJuZWRcbiAgcHJvbWlzZS5NQVggPSBtc3NxbC5NQVg7XG4gIFxuICAvL2JhY2sgcmVmZXJlbmNlIHRvIGNhY2hlXG4gIHByb21pc2UuX21zc3FsbmdLZXkgPSBrZXk7XG5cbiAgLy9leHRlbmRlZCBtZXRob2RzXG4gIHByb21pc2UuY2xvc2UgPSAoKT0+cHJvbWlzZS50aGVuKChjb25uKT0+Y29ubi5jbG9zZSgpKS5jYXRjaCgoKT0+eyBkZWxldGUgcHJvbWlzZXNba2V5XTsgZGVsZXRlIGNvbm5lY3Rpb25zW2tleV0gfSk7XG4gIHByb21pc2UucXVlcnkgPSAodGVtcGxhdGVQYXJ0cywgLi4ucGFyYW1zKT0+cHJvbWlzZS50aGVuKChjb25uKT0+cXVlcnkoY29ubix7fSx0ZW1wbGF0ZVBhcnRzLHBhcmFtcykpO1xuICBwcm9taXNlLnF1ZXJ5U3RyZWFtID0gKHRlbXBsYXRlUGFydHMsIC4uLnBhcmFtcyk9PnByb21pc2UudGhlbigoY29ubik9PnF1ZXJ5KGNvbm4se3N0cmVhbTp0cnVlfSx0ZW1wbGF0ZVBhcnRzLHBhcmFtcykpO1xuICBwcm9taXNlLm91dHB1dCA9IHJlcXVpcmUoJy4uL3BhcmFtZXRlcnMvb3V0cHV0Jyk7XG4gIHByb21pc2UuaW5wdXQgPSByZXF1aXJlKCcuLi9wYXJhbWV0ZXJzL2lucHV0Jyk7XG5cbiAgZGVidWcoJ2NyZWF0ZUNvbm5lY3Rpb25Qcm9taXNlJywnc3VjY2VzcycpO1xuICByZXR1cm4gcHJvbWlzZTtcbn1cblxuXG4vL2hhbmRsZSBwcm9taXNlIHJlc29sdXRpb24gZm9yIGNvbm5lY3Rpb24gY2FsbGJhY2tcbmZ1bmN0aW9uIGhhbmRsZUNvbm5lY3Rpb25DYWxsYmFjayhlcnIsIHJlc29sdmUsIHJlamVjdCwga2V5LCBjb25uZWN0aW9uKSB7XG4gIGRlYnVnKCdoYW5kbGVDb25uZWN0aW9uQ2FsbGJhY2snLCdzdGFydCcpO1xuXG4gIC8vZXJyb3IsIHJlbW92ZSBjYWNoZWQgZW50cnksIHJlamVjdCB0aGUgcHJvbWlzZVxuICBpZiAoZXJyKSB7XG4gICAgZGVidWcoJ2hhbmRsZUNvbm5lY3Rpb25DYWxsYmFjaycsJ2Vycm9yJyxlcnIpO1xuICAgIGRlbGV0ZSBwcm9taXNlc1trZXldO1xuICAgIHJldHVybiByZWplY3QoZXJyKTtcbiAgfVxuXG4gIC8vcGF0Y2ggY2xvc2UgbWV0aG9kIGZvciBjYWNoaW5nXG4gIHNoYWRvd0Nsb3NlKGNvbm5lY3Rpb24pO1xuXG4gIC8vY3JlYXRlIGEgcmVmZXJlbmNlIHRvIHRoZSBvcmlnaW5hbCBjb25uZWN0aW9uIGZvciBjbGVhbnVwXG4gIGNvbm5lY3Rpb24uX21zc3FsbmdLZXkgPSBrZXk7XG5cbiAgLy9hZGQgY29ubmVjdGlvbiB0byB0aGUgcG9vbFxuICBjb25uZWN0aW9uc1tjb25uZWN0aW9uLl9tc3NxbG5nS2V5XSA9IGNvbm5lY3Rpb247XG5cbiAgLy9yZXNvbHZlIHRoZSBwcm9taXNlXG4gIGRlYnVnKCdoYW5kbGVDb25uZWN0aW9uQ2FsbGJhY2snLCdzdWNjZXNzJyk7XG4gIHJldHVybiByZXNvbHZlKGNvbm5lY3Rpb24pO1xufSJdfQ==