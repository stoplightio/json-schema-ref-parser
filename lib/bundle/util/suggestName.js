"use strict";

const { basename, extname } = require("@stoplight/path");
const { get } = require("./object");

const MAX_ATTEMPTS = 10000;

function capitalize (name) {
  return name[0].toUpperCase() + name.slice(1);
}

function prettify (name) {
  return capitalize(name.replace(/(?:\.|[\\/]+)([a-z])?/g, (_, letter, i) => {
    return letter === undefined ? i === 0 ? "" : "_" : `_${letter.toUpperCase()}`;
  }));
}

function suggestName (root, takenKeys, name) {
  let suggestedName = name;
  let i = 2;
  while ((root && suggestedName in root) || takenKeys.has(suggestedName)) {
    suggestedName = `${name}_${i++}`;
    if (i > MAX_ATTEMPTS) {
      throw new Error("Too many attempts");
    }
  }

  return suggestedName;
}

module.exports.createSuggester = function (root) {
  let computed = {};
  let takenKeys = new Set();

  return {
    getExistingSuggestion (id) {
      return computed[id];
    },

    suggestNameForFilePath (schema, filepath) {
      if (!computed[filepath]) {
        let schemaRoot = get(schema, root); // todo: cache?
        let name = suggestName(schemaRoot, takenKeys, prettify(basename(filepath, extname(filepath))));
        takenKeys.add(name);
        computed[filepath] = `${root}/${name}`;
      }

      return computed[filepath];
    },

    suggestNameForPointer (schema, pointer) {
      if (!computed[pointer]) {
        let schemaRoot = get(schema, root); // todo: cache?
        let actualPath = pointer.split(root.slice(1)).slice(1);

        let name = suggestName(schemaRoot, takenKeys, prettify(actualPath.join("/")));

        takenKeys.add(name);
        computed[pointer] = `${root}/${name}`;
      }

      return computed[pointer];
    }
  };
};
