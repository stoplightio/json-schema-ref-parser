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
  if (pathFromRoot && isParameterPlacement(pathFromRoot.split("/"))) {
    return "#/parameters";
  }
  if (pathFromRoot && isResponsePlacement(pathFromRoot.split("/"))) {
    return "#/responses";
  }

  return "#/definitions";
};

const defaultOas3RootResolver = (pathFromRoot) => {
  if (pathFromRoot && isParameterPlacement(pathFromRoot.split("/"))) {
    return "#/components/parameters";
  }
  if (pathFromRoot && isResponsePlacement(pathFromRoot.split("/"))) {
    return "#/components/responses";
  }

  return "#/components/schemas";
};

module.exports.defaultOas2RootResolver = defaultOas2RootResolver;
module.exports.defaultOas3RootResolver = defaultOas3RootResolver;

module.exports.getDefaultsForOAS2 = function (defaults = getGenericDefaults(new KeyGenerator(defaultOas2RootResolver))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      if (
        !pathFromRoot.startsWith(defaults.defaultRoot(pathFromRoot)) &&
        !isSchemaPlacement(pathFromRoot.split("/")) &&
        !isParameterPlacement(pathFromRoot.split("/")) &&
        !isResponsePlacement(pathFromRoot.split("/"))
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
  return module.exports.getDefaultsForOAS2(defaults);
};

function normalizeOasSchemasHash (hash, root) {
  return hash.replace(/\/(?:components\/schemas|definitions)\//g, root.slice(1) + "/");
}

// this should return true for every place in a OAS document that can reference a JSON Schema model
function isSchemaPlacement (path) {
  if (isInOasOperation(path) && path.includes("schema")) {
    return true;
  }

  return false;
}

// this should return true for every place in a OAS document that can reference a parameter
function isParameterPlacement (path) {
  if (isInOasOperation(path) && path.includes("parameters")) {
    return true;
  }

  return false;
}

// this should return true for every place in a OAS document that can reference a response
function isResponsePlacement (path) {
  if (isInOasOperation(path) && path[path.length - 2] === "responses") {
    return true;
  }

  return false;
}


function isInOasOperation (path) {
  return path.length > 3 && path[1] === "paths";
}
