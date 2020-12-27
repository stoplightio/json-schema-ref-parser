"use strict";
const url = require("../util/url");
const KeyGenerator = require("./util/key-generator");

function getGenericDefaults (generator) {
  return {
    defaultRoot: generator.root,

    generateKey (schema, file, hash, pathFromRoot) {
      if (!url.isFileSystemPath(file) && !url.isHttp(file)) {
        return null;
      }

      if (hash !== "#" && hash !== null) {
        let existingGeneratedKey = generator.getExistingGeneratedKey(schema, file);

        if (existingGeneratedKey === null) {
          return null;
        }

        if (!generator.isInRoot(hash)) {
          return null;
        }

        return generator.generateKeyForPointer(schema, existingGeneratedKey === undefined ? pathFromRoot : existingGeneratedKey + hash.slice(1));
      }

      if (url.isHttp(file)) {
        return generator.generateKeyForUrl(schema, file);
      }

      return generator.generateKeyForFilepath(schema, file);
    },
    shouldInline () {
      return false;
    },
  };
}

module.exports.getGenericDefaults = getGenericDefaults;
module.exports.getDefaultsForOldJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator("#/definitions"))) {
  return {
    ...defaults,
    shouldInline (pathFromRoot) {
      let parsed = url.safePointerToPath(pathFromRoot);
      return parsed.length === 2 && parsed[0] === "definitions";
    }
  };
};

module.exports.getDefaultsForNewJsonSchema = function (defaults = getGenericDefaults(new KeyGenerator("#/$defs"))) {
  return {
    ...defaults,
    shouldInline (pathFromRoot) {
      let parsed = url.safePointerToPath(pathFromRoot);
      return parsed.length === 2 && parsed[0] === "$defs";
    }
  };
};

module.exports.getDefaultsForOAS2 = function (defaults = getGenericDefaults(new KeyGenerator("#/definitions"))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      if (hash !== "#" && hash !== null) {
        return defaults.generateKey(schema, file, normalizeOasSchemasHash(hash, defaults.defaultRoot));
      }

      return defaults.generateKey(schema, file, hash, pathFromRoot);
    },
    shouldInline (pathFromRoot) {
      pathFromRoot = normalizeOasSchemasHash(pathFromRoot, defaults.defaultRoot);

      let parsed = url.safePointerToPath(pathFromRoot);
      return parsed.length === 0 || (parsed.length === 2 && parsed[0] === "definitions");
    }
  };
};

module.exports.getDefaultsForOAS3 = function (defaults = getGenericDefaults(new KeyGenerator("#/components/schemas"))) {
  return {
    ...defaults,
    generateKey (schema, file, hash, pathFromRoot) {
      if (hash !== "#" && hash !== null) {
        return defaults.generateKey(schema, file, normalizeOasSchemasHash(hash, defaults.defaultRoot), pathFromRoot);
      }

      return defaults.generateKey(schema, file, hash, pathFromRoot);
    },
    shouldInline (pathFromRoot) {
      pathFromRoot = normalizeOasSchemasHash(pathFromRoot, defaults.defaultRoot);

      let parsed = url.safePointerToPath(pathFromRoot);

      if (pathFromRoot.startsWith("#/components/schemas")) {
        return parsed.length === 2 && parsed[0] === "components" && parsed[1] === "schemas";
      }

      return parsed.length === 0;
    }
  };
};

function normalizeOasSchemasHash (hash, root) {
  return hash.replace(/\/(?:components\/schemas|definitions)\//g, root.slice(1) + "/");
}
