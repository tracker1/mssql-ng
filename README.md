# mssql-ng

Next Generation MS-SQL Client Interface for Node.js/io.js

This module provides an interface to use JavaScript (ES6/ES2015) Template strings in order to construct SQL requests. 

This library inherits [mssql](https://www.npmjs.com/package/mssql)  module under the covers.  For best use, you should use a version of node/io.js that supports template strings or use a transpiler like BabelJS.


## Disclaimer

**This is a work in progress**, it's not very well tested (eslint doesn't like the splats, and haven't written tests).  A cursory test against an actual SQL server instance for input/output parameters seems to work.


## Requirements

* Promises - Requires a native or [i-promise](https://www.npmjs.com/package/i-promise) compatible Promise implementation
* mssql - mssql `^2.1.2` required, which is the latest as of this module's release


## Usage

Responses with multiple recordsets are not supported.  Use `mssql` directly.

```
var sql = require('mssql-ng');
var opts = {...} // mssql's connection options
```

The module itself is a method that returns a Promise that will resolve with the active connection, similar to `mssql.connect()` ... there will be additional methods for template parsers attached to the Promise itself (these will not carry forward).  This allows one to resolve the connection object directly (since mssql's resolver doesn't include a reference to the connection object).

```
sql(opts)
  .then(function(conn){
    //use connection
    var request = new mssql.Request(conn);
    ...
  });
```

The promise returned from `sql(options)` will have two additional methods (`.query` and `.queryStream`).  These methods do not get carried forward with the Promise chain.


### sql(opts).query - returns Promise - resolves {parameters,recordset}

For output parameters, use the module's `out` method, passing the name of the parameter, as well as the datatype of the parameter from `mssql`

```
function validateLogin(email, password) {
  var app = '89265a96-07ae-4463-a8d6-00a18140a030';

  return sql(opts).query`
    SET ${sql.output('paramName', mssql.Int)} = 5;

    SELECT m.*
    FROM aspnet_Membership m
    WHERE m.LowerdEmail = ${username.toLowerCase()}
      AND m.ApplicationId = ${app}
  `.then(function(result){
    //output parameter
    var paramName = result.parameters.paramName;

    //recordset - result.recordset contains the rows
    var member = result && result.recordset && result.recordset[0];
    if (!member) throw new Error('No matching user found');
    return validateHash(password, member.PasswordSalt, member.Password);
  });
}
```

### sql(opts).queryStream - returns Promise - resolves streaming mssql request object

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

### sql.input(name,type,value) - specify parameter name and `mssql` datatype

If you want to specify the `mssql` datatype, you can use `sql.input` in your template.

```
sql(opts).query`

  EXEC someSproc sql.input('myParam', sql.Decimal(22,5), 45.333)

`.then(function(result){
  ...
})
```

### sql.output(name,type,defaultValue)

If you need an output parameter, you can use `sql.output` to specify the parameter name and type.

```
sql(opts).query`

  SET ${sql.output('myParam', sql.DateTimeOffset, null)} = SYSDATETIMEOFFSET()

`.then(function(result){

  console.log(result.parameters.myParam); //date-time

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

### safe-clone-deep and json-stable-stringify

The options object passed into the module method will be cloned, and stringified version is used for pooling-key.

-----


## Type checking

This module will *only* do very simplistic type checking...

* null or undefined - `Bit` set to null
* Boolean - will use `Bit`
* Number
  * `~~num === num` - `Int`
  * `Math.floor(num) === Math.ceil(num)` - `BigInt`
  * otherwise `Float`
* Objects
  * Buffer - `VarBinary`
  * Date - `DateTimeOffset`
  * otherwise fallthrough to string using `JSON.stringify(safeclonedeep(value))`
* String
  * UUID - via regular expression test - `UniqueIdentifier`
  * otherwise `NVarChar`

NOTE: If you need another interpretation for numbers, you can pass it as an appropriately formatted string (SQL coersion) or you can use `sql.input` to specify a different type.

