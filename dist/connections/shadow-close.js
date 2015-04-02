"use strict";

var _require = require("../cache");

var connections = _require.connections;
var promises = _require.promises;

module.exports = shadowClose;

//shadow the close method, so that it will clear itself from the pool
function shadowClose(connection) {
  var close = connection.close;
  connection.close = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    //remove references
    delete promises[key];
    delete connections[key];

    try {
      //close original connection
      close.apply(connection, args);
    } catch (err) {}

    //clear local references - allow GC
    close = null;
    connection - null;
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb25uZWN0aW9ucy9zaGFkb3ctY2xvc2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7ZUFBNkIsT0FBTyxDQUFDLFVBQVUsQ0FBQzs7SUFBM0MsV0FBVyxZQUFYLFdBQVc7SUFBQyxRQUFRLFlBQVIsUUFBUTs7QUFFekIsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7OztBQUc3QixTQUFTLFdBQVcsQ0FBQyxVQUFVLEVBQUU7QUFDL0IsTUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztBQUM3QixZQUFVLENBQUMsS0FBSyxHQUFHLFlBQWtCO3NDQUFOLElBQUk7QUFBSixVQUFJOzs7O0FBRWpDLFdBQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3JCLFdBQU8sV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUV4QixRQUFJOztBQUVGLFdBQUssQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFDLElBQUksQ0FBQyxDQUFDO0tBQzlCLENBQUMsT0FBTSxHQUFHLEVBQUUsRUFBRTs7O0FBR2YsU0FBSyxHQUFHLElBQUksQ0FBQztBQUNiLGNBQVUsR0FBRyxJQUFJLENBQUM7R0FDbkIsQ0FBQTtDQUNGIiwiZmlsZSI6InNyYy9jb25uZWN0aW9ucy9zaGFkb3ctY2xvc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyJsZXQge2Nvbm5lY3Rpb25zLHByb21pc2VzfSA9IHJlcXVpcmUoJy4uL2NhY2hlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gc2hhZG93Q2xvc2U7XG5cbi8vc2hhZG93IHRoZSBjbG9zZSBtZXRob2QsIHNvIHRoYXQgaXQgd2lsbCBjbGVhciBpdHNlbGYgZnJvbSB0aGUgcG9vbFxuZnVuY3Rpb24gc2hhZG93Q2xvc2UoY29ubmVjdGlvbikge1xuICBsZXQgY2xvc2UgPSBjb25uZWN0aW9uLmNsb3NlO1xuICBjb25uZWN0aW9uLmNsb3NlID0gZnVuY3Rpb24oLi4uYXJncykge1xuICAgIC8vcmVtb3ZlIHJlZmVyZW5jZXNcbiAgICBkZWxldGUgcHJvbWlzZXNba2V5XTtcbiAgICBkZWxldGUgY29ubmVjdGlvbnNba2V5XTtcblxuICAgIHRyeSB7XG4gICAgICAvL2Nsb3NlIG9yaWdpbmFsIGNvbm5lY3Rpb25cbiAgICAgIGNsb3NlLmFwcGx5KGNvbm5lY3Rpb24sYXJncyk7XG4gICAgfSBjYXRjaChlcnIpIHt9XG5cbiAgICAvL2NsZWFyIGxvY2FsIHJlZmVyZW5jZXMgLSBhbGxvdyBHQ1xuICAgIGNsb3NlID0gbnVsbDtcbiAgICBjb25uZWN0aW9uIC0gbnVsbDtcbiAgfVxufSJdfQ==