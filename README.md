# WARNING!!!

```
#################################################################
WORK IN PROGRESS - NO CODE CHECKED IN, LAYING OUT INTERFACE FIRST
#################################################################
```

# mssql-ng

Next Generation MS-SQL Client Interface for Node.js/io.js

This module provides an interface to use JavaScript (ES6/ES2015) Template strings in order to construct SQL requests. 

This library works with [mssql](https://www.npmjs.com/package/mssql)  module under the covers.  All connection options will be passed-through.


## Usage

Responses with multiple recordsets are not supported.  Use `mssql` directly.

```
var mssql = require('mssql');
var sql = require('mssql-ng');
var opts = {...} // mssql's connection options
```

### Module method

The module itself is a method that returns a Promise that will resolve with the active connection, similar to `mssql.connect()` ... there will be additional methods for template parsers attached to the Promise itself (these will not carry forward).  This allows one to resolve the connection object directly (since mssql's resolver doesn't include a reference to the connection object).

NOTE: This method will disable the streaming option if specified.  If you want global streaming, use mssql directly, this is for convenience only.

```
sql(opts)
  .then(function(conn){
    //use connection
    var request = new mssql.Request(conn);
    ...
  });
```

The promise returned from `sql(options)` will have two additional methods (`.query` and `.queryStream`).  These methods do not get carried forward with the Promise chain.


### .query - returns Promise - resolves recordset

```
function validateLogin(email, password) {
  var app = '89265a96-07ae-4463-a8d6-00a18140a030';

  return sql(opts).query`
    SELECT m.*
    FROM aspnet_Membership m
    WHERE m.LowerdEmail = ${username.toLowerCase()}
      AND m.ApplicationId = ${app}
  `.then(function(results){
    if (!(results && results.length)) throw new Error('No matching user found');
    var membership = results[0];
    return validateHash(password, results[0].PasswordSalt, results[0].Password);
  });
}
```

### .queryStream - returns Promise - resolves streamable request object

*Note: mssql/tedious does not support backpressure*

```
sql(opts).queryStream`
  SELECT *
  FROM SomeTable
  WHERE Foo=${someBar}
    AND Baz=${true}
    AND Something <= ${new Date()}
`.then(function(request){
  return new Promise(function(resolve,reject){
    recordStream
      .pipe(itemProcessor)
      .on('error',reject)
      .on('end',resolve)
      .resume();
  });
})
.catch(function(err){
  console.error(err);
  process.exit(200);
})
```

### Other options

If you need to make other types of requests, you should use the `mssql` module itself.

-----


## Dependencies


### mssql >= 2.0.0

This module uses [mssql](https://www.npmjs.com/package/mssql) as a peerDependency.  All connection options use this module under the covers.


### i-promise

This module uses [i-promise](https://www.npmjs.com/package/i-promise) to retrieve a promise implementation to use.  If you are running a legacy version of Node/io.js you will need to install a compatible promise library.  If you wish to force a promise library, you can do so.

```
require('i-promise/config').use(require('bluebird'));
```

### shallow-copy

The options object passed into the module method will be shallow copied and the `stream` option deleted.

-----


## Type checking

This module will *only* do very simplistic type checking...

* Date - instances will be set to `DATETIMEOFFSET(7)`
* Boolean - will use `bit` (0 or 1)
* Number - will use the closest available match
  * `~~num` matches input, uses `int`
  * otherwise will use `VARCHAR(###)`
* String
  * `UNIQUEIDENTIFIER` when matching regex
  * otherwise `NVARCHAR(MAX)`
* Buffer will use `VarBinary(MAX)`

