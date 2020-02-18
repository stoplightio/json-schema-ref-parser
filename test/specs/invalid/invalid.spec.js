"use strict";

const chai = require("chai");
const { expect } = chai;
chai.use(require("chai-as-promised"));

const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");

describe("Invalid syntax", () => {
  describe("in main file", () => {
    it("should throw an error for an invalid file path", () => {
      return expect($RefParser.dereference("this file does not exist")).to.eventually.rejectedWith(Error, "ENOENT: no such file or directory");
    });

    it("should not throw an error for an invalid YAML file", () => {
      return expect($RefParser.dereference(path.rel("specs/invalid/invalid.yaml"))).to.eventually.null;
    });

    it("should not throw an error for an invalid JSON file", () => {
      return expect($RefParser.dereference(path.rel("specs/invalid/invalid.json"))).to.eventually.deep.equal({});
    });

    it("should not throw an error for an invalid JSON file with YAML disabled", () => {
      return expect($RefParser.dereference(path.rel("specs/invalid/invalid.json"), { parse: { yaml: false }})).to.eventually.deep.equal({});
    });

    it("should not throw an error for an invalid YAML file with JSON and YAML disabled", () => {
      return expect($RefParser.dereference(path.rel("specs/invalid/invalid.json"), { parse: { yaml: false, json: false }})).to.eventually.null;
    });
  });

  describe("in referenced files", () => {
    it("should not throw an error for an invalid YAML file", () => {
      return expect($RefParser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }})).to.eventually.deep.equal({
        foo: null,
      });

    });

    it("should not throw an error for an invalid JSON file", () => {
      return expect($RefParser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }})).to.eventually.deep.equal({
        foo: {},
      });
    });

    it("should throw an error for an invalid JSON file with YAML disabled", () => {
      return expect($RefParser.dereference({ foo: { $ref: path.rel("specs/invalid/invalid.json") }}, {
        parse: { yaml: false }
      })).to.eventually.deep.equal({
        foo: {},
      });
    });

    it("should NOT throw an error for an invalid YAML file with JSON and YAML disabled", async () => {
      const schema = await $RefParser
        .dereference({ foo: { $ref: path.rel("specs/invalid/invalid.yaml") }}, {
          parse: { yaml: false, json: false }
        });

      // Because the JSON and YAML parsers were disabled, the invalid YAML file got parsed as plain text
      expect(schema).to.deep.equal({
        foo: ":\n"
      });
    });
  });
});
