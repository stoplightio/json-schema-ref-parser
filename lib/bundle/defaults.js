"use strict";
const url = require("../util/url");
const createSuggester = require("./util/suggestName");

function generateBase (defaultRoot) {
  let suggestions = createSuggester(defaultRoot);

  return {
    defaultRoot,

    generateKey (schema, file, hash) {
      if (!url.isFileSystemPath(file) && !url.isHttp(file)) {
        return null;
      }

      if (hash !== "#" && hash !== null) {
        let existingSuggestion = suggestions.getExistingSuggestion(file);

        if (existingSuggestion === null) {
          return null;
        }

        if (!suggestions.isInRoot(hash)) {
          return existingSuggestion + hash.slice(1);
        }

        return suggestions.suggestNameForPointer(schema, existingSuggestion + hash.slice(1));
      }

      if (url.isHttp(file)) {
        return suggestions.suggestNameForUrl(schema, file);
      }

      return suggestions.suggestNameForFilePath(schema, file);
    },
    shouldInline () {
      return false;
    },
  };
}

module.exports.getDefaultsForOldJsonSchema = function () {
  return generateBase("#/definitions");
};

module.exports.getDefaultsForNewJsonSchema = function () {
  return generateBase("#/$defs");
};

module.exports.getDefaultsForOAS2 = function () {
  let opts = generateBase("#/definitions");

  return {
    ...opts,
    generateKey (schema, file, hash) {
      if (hash !== "#" && hash !== null) {
        return opts.generateKey(schema, file, hash.replace(/\/components\/schemas\//g, "/definitions/"));
      }

      return opts.generateKey(schema, file, hash);
    },
    shouldInline (pathFromRoot) {
      const parsed = url.safePointerToPath(pathFromRoot);
      return parsed.length === 0 || (parsed[0] !== "definitions" && !parsed.includes("schema"));
    }
  };
};

module.exports.getDefaultsForOAS3 = function () {
  let opts = generateBase("#/components/schemas");

  return {
    ...opts,
    generateKey (schema, file, hash) {
      if (hash !== "#" && hash !== null) {
        return opts.generateKey(schema, file, hash.replace(/\/definitions\//g, "/components/schemas/"));
      }

      return opts.generateKey(schema, file, hash);
    },
    shouldInline (pathFromRoot) {
      if (pathFromRoot.startsWith("#/components/schemas")) {
        return false;
      }

      const parsed = url.safePointerToPath(pathFromRoot);

      return parsed.length === 0 || !parsed.includes("schema");
    }
  };
};

