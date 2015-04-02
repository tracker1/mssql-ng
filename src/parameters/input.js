module.exports = handleOutputParam;

function handleOutputParam(type, value) {
  return (request, index) => {
    request.input(index,type,value);
  }
}