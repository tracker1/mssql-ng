"use strict";

var debug = require("debug")("mssql-ng");

var _require = require("../cache");

var connections = _require.connections;
var promises = _require.promises;

module.exports = shadowClose;

//shadow the close method, so that it will clear itself from the pool
function shadowClose(connection) {
  debug("shadowClose", "start");

  var close = connection.close;
  connection.close = function () {
    debug("connection.close", "start");
    //remove references
    delete promises[connection._mssqlngKey];
    delete connections[connection._mssqlngKey];

    //close original connection
    setImmediate(function () {
      try {
        debug("connection.close", "apply");
        close.apply(connection);
        debug("connection.close", "applied");
        //clear local references - allow GC
        close = null;
        connection - null;
      } catch (err) {}
    });

    debug("connection.close", "end");
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25uZWN0aW9ucy9zaGFkb3ctY2xvc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUE7O2VBQ1gsT0FBTyxDQUFDLFVBQVUsQ0FBQzs7SUFBM0MsV0FBVyxZQUFYLFdBQVc7SUFBQyxRQUFRLFlBQVIsUUFBUTs7QUFFekIsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7OztBQUc3QixTQUFTLFdBQVcsQ0FBQyxVQUFVLEVBQUU7QUFDL0IsT0FBSyxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFOUIsTUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUM3QixZQUFVLENBQUMsS0FBSyxHQUFHLFlBQVc7QUFDNUIsU0FBSyxDQUFDLGtCQUFrQixFQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUVsQyxXQUFPLFFBQVEsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDeEMsV0FBTyxXQUFXLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDOzs7QUFHM0MsZ0JBQVksQ0FBQyxZQUFJO0FBQ2YsVUFBSTtBQUNGLGFBQUssQ0FBQyxrQkFBa0IsRUFBQyxPQUFPLENBQUMsQ0FBQztBQUNsQyxhQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3hCLGFBQUssQ0FBQyxrQkFBa0IsRUFBQyxTQUFTLENBQUMsQ0FBQzs7QUFFcEMsYUFBSyxHQUFHLElBQUksQ0FBQztBQUNiLGtCQUFVLEdBQUcsSUFBSSxDQUFDO09BQ25CLENBQUEsT0FBTSxHQUFHLEVBQUMsRUFBRTtLQUNkLENBQUMsQ0FBQzs7QUFFSCxTQUFLLENBQUMsa0JBQWtCLEVBQUMsS0FBSyxDQUFDLENBQUM7R0FDakMsQ0FBQTtDQUNGIiwiZmlsZSI6InNyYy9jb25uZWN0aW9ucy9zaGFkb3ctY2xvc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQgZGVidWcgPSByZXF1aXJlKCdkZWJ1ZycpKCdtc3NxbC1uZycpXG5sZXQge2Nvbm5lY3Rpb25zLHByb21pc2VzfSA9IHJlcXVpcmUoJy4uL2NhY2hlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhZG93Q2xvc2U7XG5cbi8vc2hhZG93IHRoZSBjbG9zZSBtZXRob2QsIHNvIHRoYXQgaXQgd2lsbCBjbGVhciBpdHNlbGYgZnJvbSB0aGUgcG9vbFxuZnVuY3Rpb24gc2hhZG93Q2xvc2UoY29ubmVjdGlvbikge1xuICBkZWJ1Zygnc2hhZG93Q2xvc2UnLCAnc3RhcnQnKTtcblxuICBsZXQgY2xvc2UgPSBjb25uZWN0aW9uLmNsb3NlO1xuICBjb25uZWN0aW9uLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgZGVidWcoJ2Nvbm5lY3Rpb24uY2xvc2UnLCdzdGFydCcpO1xuICAgIC8vcmVtb3ZlIHJlZmVyZW5jZXNcbiAgICBkZWxldGUgcHJvbWlzZXNbY29ubmVjdGlvbi5fbXNzcWxuZ0tleV07XG4gICAgZGVsZXRlIGNvbm5lY3Rpb25zW2Nvbm5lY3Rpb24uX21zc3FsbmdLZXldO1xuXG4gICAgLy9jbG9zZSBvcmlnaW5hbCBjb25uZWN0aW9uXG4gICAgc2V0SW1tZWRpYXRlKCgpPT57XG4gICAgICB0cnkge1xuICAgICAgICBkZWJ1ZygnY29ubmVjdGlvbi5jbG9zZScsJ2FwcGx5Jyk7XG4gICAgICAgIGNsb3NlLmFwcGx5KGNvbm5lY3Rpb24pO1xuICAgICAgICBkZWJ1ZygnY29ubmVjdGlvbi5jbG9zZScsJ2FwcGxpZWQnKTtcbiAgICAgICAgLy9jbGVhciBsb2NhbCByZWZlcmVuY2VzIC0gYWxsb3cgR0NcbiAgICAgICAgY2xvc2UgPSBudWxsO1xuICAgICAgICBjb25uZWN0aW9uIC0gbnVsbDtcbiAgICAgIH1jYXRjaChlcnIpe31cbiAgICB9KTtcblxuICAgIGRlYnVnKCdjb25uZWN0aW9uLmNsb3NlJywnZW5kJyk7XG4gIH1cbn0iXX0=