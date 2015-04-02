module.exports = handleOutputParam;

function handleOutputParam(name, type, value) {
  return (request, index) => {
    request.input(name,type,value);
    return name;
  };
}