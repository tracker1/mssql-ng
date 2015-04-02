module.exports = handleOutputParam;

function handleOutputParam(name, type, value) {
  return (request, index) => {
    request.output(parameterName, type, value);
    return name;
  };
}