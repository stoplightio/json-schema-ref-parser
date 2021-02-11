"use strict";
const url = require("../util/url");
const KeyGenerator = require("./util/key-generator");

function getGenericDefaults (generator) {
  return {
    defaultRoot: generator.root,

    generateKey (schema, file, hash, pathFromRoot) {
      if (generator.isUnderDirectRoot(pathFromRoot)) {
        return null;
      }

      if (!url.isFileSystemPath(file) && !url.isHttp(file)) {
        return null;
      }

      if (hash !== "#" && hash !== null) {
        let existingGeneratedKey = generator.getExistingGeneratedKey(schema, file);

        if (existingGeneratedKey === undefined) {
          existingGeneratedKey = generator.generateKeyForFilepath(schema, file, pathFromRoot);
        }

        if (existingGeneratedKey === null) {
          return null;
        }

        if (!generator.isInRoot(hash, pathFromRoot)) {
          return null;
        }

        return generator.generateKeyForPointer(schema, existingGeneratedKey + hash.slice(1), pathFromRoot);
      }

      if (url.isHttp(file)) {
        return generator.generateKeyForUrl(schema, file, pathFromRoot);
      }

      return generator.generateKeyForFilepath(schema, file, pathFromRoot);
    },
  };
}

module.exports.getGenericDefaults = getGenericDefaults;

module.exports.getDefaultsForOldJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator(() => "#/definitions"))) {
  return defaults;
};

module.exports.getDefaultsForNewJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator(() => "#/$defs"))) {
  return defaults;
};

const defaultOas2RootResolver = (pathFromRoot) => {
  const pathParsed = pathFromRoot.split("/");

  if (canReferenceParameter(pathParsed)) {
    return "#/parameters";
  }
  if (canReferenceResponse(pathParsed)) {
    return "#/responses";
  }

  return "#/definitions";
};

const defaultOas3RootResolver = (pathFromRoot) => {
  const pathParsed = pathFromRoot.split("/");

  if (canReferenceParameter(pathParsed)) {
    return "#/components/parameters";
  }
  if (canReferenceResponse(pathParsed)) {
    return "#/components/responses";
  }
  if (canReferenceRequestBody(pathParsed)) {
    return "#/components/requestBodies";
  }

  return "#/components/schemas";
};

module.exports.defaultOas2RootResolver = defaultOas2RootResolver;
module.exports.defaultOas3RootResolver = defaultOas3RootResolver;

module.exports.getDefaultsForOAS2 = function (defaults = getGenericDefaults(new KeyGenerator(module.exports.defaultOas2RootResolver))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      if (
        !pathFromRoot.startsWith(defaults.defaultRoot(pathFromRoot)) &&
        !canReferenceSchema(pathFromRoot.split("/")) &&
        !canReferenceParameter(pathFromRoot.split("/")) &&
        !canReferenceResponse(pathFromRoot.split("/"))
      ) {
        return null;
      }

      if (hash !== "#" && hash !== null) {
        return defaults.generateKey(schema, file, normalizeOasSchemasHash(hash, defaults.defaultRoot(pathFromRoot)), pathFromRoot);
      }

      return defaults.generateKey(schema, file, hash, pathFromRoot);
    },
  };
};

module.exports.getDefaultsForOAS3 = function (defaults = getGenericDefaults(new KeyGenerator(defaultOas3RootResolver))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      if (
        !pathFromRoot.startsWith(defaults.defaultRoot(pathFromRoot)) &&
        !canReferenceSchema(pathFromRoot.split("/")) &&
        !canReferenceParameter(pathFromRoot.split("/")) &&
        !canReferenceResponse(pathFromRoot.split("/")) &&
        !canReferenceRequestBody(pathFromRoot.split("/"))
      ) {
        return null;
      }

      if (hash !== "#" && hash !== null) {
        return defaults.generateKey(schema, file, normalizeOasSchemasHash(hash, defaults.defaultRoot(pathFromRoot)), pathFromRoot);
      }

      return defaults.generateKey(schema, file, hash, pathFromRoot);
    },
  };
};

function normalizeOasSchemasHash (hash, root) {
  return hash.replace(/\/(?:components\/schemas|definitions)\//g, root.slice(1) + "/");
}

function canReferenceSchema (path) {
  if (path.length > 3 && path[1] === "paths" && path.includes("schema")) {
    return true;
  }

  return false;
}

function canReferenceParameter (path) {
  // #/paths/pathName/parameters/0
  if (path.length === 5 && path[1] === "paths" && path[3] === "parameters") {
    return true;
  }

  // #/paths/pathName/pathMethod/parameters/0
  if (path.length === 6 && path[1] === "paths" && path[4] === "parameters") {
    return true;
  }

  return false;
}

function canReferenceResponse (path) {
  // #/paths/pathName/pathMethod/responses/statusCode
  if (path.length === 6 && path[1] === "paths" && path[4] === "responses") {
    return true;
  }

  return false;
}

function canReferenceRequestBody (path) {
  // #/paths/pathName/pathMethod/requestBody
  if (path.length === 5 && path[1] === "paths" && path[4] === "requestBody") {
    return true;
  }

  return false;
}
