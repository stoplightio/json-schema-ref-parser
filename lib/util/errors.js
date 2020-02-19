"use strict";

const { DiagnosticSeverity } = require("@stoplight/types");

const ParsingError = exports.ParsingError = class extends Error {
  constructor (errors, source) {
    super();

    this.errors = errors.map(error => ({
      ...error,
      source,
    }));
  }

  static createGenericErrorEntry (message) {
    return {
      code: "parser",
      message,
      severity: DiagnosticSeverity.Error,
      range: {
        start: { character: 0, line: 0 },
        end: { character: 0, line: 0 },
      },
    };
  }
};

Object.defineProperties(ParsingError.prototype, {
  name: {
    value: "ParsingError",
  },
  message: {
    value: "Parsing Error",
    writable: true,
  }
});
