"use strict";

const chai = require("chai");
const chaiSubset = require("chai-subset");
chai.use(chaiSubset);
const { expect } = chai;
const $RefParser = require("../../../lib");
const helper = require("../../utils/helper");
const path = require("../../utils/path");
const parsedSchema = require("./parsed");
const dereferencedSchema = require("./dereferenced");

describe("Schema with a $ref nested inside an extended $ref", () => {
  it("should parse successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.parse(
      path.rel("specs/nested-extended/nested-extended.yaml")
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([
      path.abs("specs/nested-extended/nested-extended.yaml"),
    ]);
  });

  it("should resolve successfully", helper.testResolve(
    path.rel("specs/nested-extended/nested-extended.yaml"),
    path.abs("specs/nested-extended/nested-extended.yaml"), parsedSchema.schema,
    path.abs("specs/nested-extended/referenced-root.yaml"), parsedSchema.root,
    path.abs("specs/nested-extended/referenced-object-child.yaml"), parsedSchema.objectchild,
    path.abs("specs/nested-extended/referenced-array-child.yaml"), parsedSchema.arraychild
  ));

  it("should dereference successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(
      path.rel("specs/nested-extended/nested-extended.yaml")
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it("should bundle successfully", async () => {
    let parser = new $RefParser();
    const schema = await parser.bundle(
      path.rel("specs/nested-extended/nested-extended.yaml")
    );
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
  });
});
