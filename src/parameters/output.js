module.exports = handleOutputParam;

function handleOutputParam(parameterName, type) {
  return (request, index) => {
    request.output(parameterName, type);
  }
}