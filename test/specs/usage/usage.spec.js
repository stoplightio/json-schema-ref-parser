"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const setupHttpMocks = require("../../utils/setup-http-mocks");

describe("Usage", () => {
  beforeEach(() => {
    setupHttpMocks({
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v1.json?mid=1": { title: "Book v1 (mid=1)" },
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v1.json": { title: "Book v1" },
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v2.json": { title: "Book v2" },
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/books.json": {
        oneOf: [
          {
            $ref: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v1.json"
          },
          {
            $ref: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v1.json?mid=1"
          },
          {
            $ref: "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v2.json"
          }
        ]
      }
    });
  });

  it("dereference should track usage of $refs", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/usage/definitions/document.json"));

    expect(schema.properties.books.oneOf).to.deep.equal([
      { title: "Book v1" },
      { title: "Book v1 (mid=1)" },
      { title: "Book v2" },
    ]);

    expect(parser.$refs.propertyMap).to.deep.equal({
      "#/properties/books": path.abs("specs/usage/definitions/design-library.json") + "#/definitions/Books",
      "#/properties/books/oneOf/0": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v1.json",
      "#/properties/books/oneOf/1": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v1.json?mid=1",
      "#/properties/books/oneOf/2": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/book.v2.json",
      "#/properties/design-library": path.abs("specs/usage/definitions/design-library.json"),
      "#/properties/design-library/definitions/Books": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/usage/nodes/reference/books.json"
    });
  });

  it("bundle with no custom roots should track usage of $refs", async () => {
    let parser = new $RefParser();
    await parser.bundle(path.rel("specs/usage/test.yaml"));

    expect(parser.$refs.propertyMap).to.deep.equal({
      "#/properties/bar": path.abs("specs/usage/test.yaml") + "#/properties/foo",
      "#/properties/test": path.abs("specs/usage/test.yaml") + "#/properties/foo/properties/baz"
    });
  });
});
