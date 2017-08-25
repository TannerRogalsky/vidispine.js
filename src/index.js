const parseString = require('xml2js').parseString;

const tryMap = function tryMap(object, callback) {
  if (object && object.map) {
    return object.map(callback);
  } else {
    return [];
  }
}

const checkAndRecurse = function checkAndRecurse(resource) {
  if (resource.resource) {
    return {
      [resource['$'].path]: resource.resource.map(checkAndRecurse)
    };
  } else {
    return {
      path: resource['$'].path,
      method: resource.method.map(function(method) {
        return {
          name: method['$'].name,
          request: tryMap(method.request, function(request) {
            return tryMap(request.representation, function(representation) {
              return representation['$'].mediaType;
            })
          }),
          response: tryMap(method.response, function(response) {
            return tryMap(response.representation, function(representation) {
              return representation['$'].mediaType;
            })
          }),
        }
      })
    }
  }
}

const isEndpoint = function isEndpoint(o) {
  return typeof(o) === 'object' && typeof(o.path) === 'string';
}

const createUrls = function createUrls(urls, base, resources) {
  return resources.reduce(function(urls, resource) {
    if (isEndpoint(resource)) {
      urls[`${base}/${resource.path}`] = resource.method.reduce(function(acc, method) {
        acc[method.name] = {
          request: method.request,
          response: method.response,
        };
        return acc;
      }, {});
      return urls;
    } else {
      return Object.keys(resource).reduce(function(urls, key) {
        return createUrls(urls, `${base}/${key}`, resource[key]);
      }, urls);
    }
  }, urls)
}

module.exports = function(wadlFile) {
  parseString(wadlFile, function (err, result) {
    const config = result.application.resources[0];
    const baseURL = config['$'].base;

    const r = config.resource.map(checkAndRecurse);
    const reduced = createUrls({}, baseURL.substring(0, baseURL.length - 1), r);

    console.log(JSON.stringify(reduced, null, 2));
  });
}
