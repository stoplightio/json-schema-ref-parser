"use strict";

const { host } = require("host-environment");
const { expect } = require("chai");
const $RefParser = require("../../..");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");

describe("Blank files", () => {
  let windowOnError, testDone;

  beforeEach(() => {
    // Some old Webkit browsers throw an error when downloading zero-byte files.
    windowOnError = host.global.onerror;
    host.global.onerror = function () {
      testDone();
      return true;
    };
  });

  afterEach(() => {
    host.global.onerror = windowOnError;
  });

  describe("referenced files", () => {
    it("should parse successfully", async () => {
      let schema = await $RefParser.parse(path.rel("specs/blank/blank.yaml"));
      expect(schema).to.deep.equal(parsedSchema.schema);
    });

    it("should resolve successfully", helper.testResolve(
      path.rel("specs/blank/blank.yaml"),
      path.abs("specs/blank/blank.yaml"), parsedSchema.schema,
      path.abs("specs/blank/files/blank.yaml"), parsedSchema.yaml,
      path.abs("specs/blank/files/blank.json"), parsedSchema.json,
      path.abs("specs/blank/files/blank.txt"), parsedSchema.text,
      path.abs("specs/blank/files/blank.png"), parsedSchema.binary,
      path.abs("specs/blank/files/blank.foo"), parsedSchema.unknown
    ));

    it("should dereference successfully", async () => {
      let schema = await $RefParser.dereference(path.rel("specs/blank/blank.yaml"));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it("should bundle successfully", async () => {
      let schema = await $RefParser.bundle(path.rel("specs/blank/blank.yaml"));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });
  });
});
