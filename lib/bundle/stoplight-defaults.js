"use strict";

const {
  getDefaultsForOldJsonSchema,
  getDefaultsForOAS2,
  getDefaultsForOAS3,
} = require("./defaults");

module.exports = {
  get oas2 () {
    return getDefaultsForOAS2();
  },
  get oas3 () {
    return getDefaultsForOAS3();
  },
  // eslint-disable-next-line camelcase
  get json_schema () {
    return getDefaultsForOldJsonSchema();
  },
};
