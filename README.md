# mssql-ng

Next Generation MS-SQL Client Interface for Node.js/io.js

This module provides an interface to use JavaScript (ES6/ES2015) Template strings in order to construct SQL requests. 

This library inherits [mssql](https://www.npmjs.com/package/mssql)  module under the covers.  For use of template processors, you should use a version of node/io.js that supports template strings or use a transpiler like BabelJS.


```js
\\reference to original module, for use with legacy code
var mssql = require('mssql-ng');

\\mssql connection options
var opts = {...} //mssql connection options

\\ ConnectionPromise (Promise which resolves to an mssql.Connection)
\\   extended with mssql.TYPES
\\   .query and .queryStream template processors
\\   .input and .output parameter handlers
var sql = mssql(opts);

...
\\ simple query template processor, returns promise for a result
sql.query`

    --you can specify output parameters (name, type, initialValue) 
    SET ${sql.output('param1', sql.NVarChar(sql.MAX)} = 'output param value'

    --input parameters can be auto-detected, or explicit
    SELECT ${someVariable1} [Test1],
           ${sql.input('param2', sql.Decimal, someNumberVariable)} [Test2]

`.then(function(result){
  
  //request parameters attached to result.parameters
  console.log('output @param1', result.parameters.param1.value);

  //recordset/rows attached to result.recordset
  console.log('row 1, column 1', result.recordset[0].Test1); 
  console.log('row 1, column 2', result.recordset[0].Test2);
 
}).catch(console.error);
```


## Requirements

* Requires native Promises or [i-promise](https://www.npmjs.com/package/i-promise) detected Promise library.
* Requires a very recent 2.x release of [mssql](https://www.npmjs.com/package/mssql) as a peerDependency.


## Usage

Responses with multiple recordsets are not supported.  Use `mssql` directly.

The module itself is a method that returns a Promise that will resolve with the active connection, similar to `mssql.connect()` ... there will be additional methods for template parsers attached to the Promise itself (these will not carry forward).  This allows one to resolve the connection object directly (since mssql's resolver doesn't include a reference to the connection object).

```js
var mssql = require('mssql-ng');
var sql = mssql(opts);

sql.then(function(conn){
  //use connection
  var request = new mssql.Request(conn);
  ...
});
```


### ConnectionPromise.query - returns Promise - resolves {parameters,recordset}

The `.query` method is an ES6 template parser, which will resolve to an object containing sql request `parameters` for access to output parameters, in addition to `recordset` which will be an array of rows for the result.


### ConnectionPromise.queryStream - returns Promise - resolves streaming mssql request object

*Note: mssql/tedious does not support backpressure*

The `.queryStream` method is an ES6 template parser, which will resolve to an `mssql.Request` which has made a query in stream mode, and is ready to pipe. 

```js
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

### ConnectionPromise.input(name,type,value) - specify parameter name and `mssql` datatype

If you want to specify the `mssql` datatype, you can use `sql.input` in your template.

```js
sql.query`

  EXEC someSproc sql.input('myParam', sql.Decimal(22,5), 45.333)

`.then(function(result){
  ...
})
```

### ConnectionPromise.output(name,type,defaultValue)

If you need an output parameter, you can use `sql.output` to specify the parameter name and type.

```js
sql.query`

  SET ${sql.output('myParam', sql.DateTimeOffset, null)} = SYSDATETIMEOFFSET()

`.then(function(result){

  console.log(result.parameters.myParam); //date-time

})
```


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

