"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const setupHttpMocks = require("../../utils/setup-http-mocks");
const { get } = require("../../../lib/bundle/util/object.js");

describe("Usage", () => {
  beforeEach(() => {
    setupHttpMocks({
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/book.v1.json?deref=bundle": require("./definitions/design-library/book.v1.json"),
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/book.v1.json?deref=bundle&mid=1": require("./definitions/design-library/book.v1-mid.json"),
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/book.v2.json?deref=bundle&mid=1": require("./definitions/design-library/book.v2.json"),
      "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/books.json?deref=bundle&mid=1": require("./definitions/design-library/books.json"),
    });
  });

  it("should track usage of $refs", async () => {
    let parser = new $RefParser();
    const schema = await parser.dereference(path.rel("specs/usage/definitions/document.json"));

    expect(get(schema, "#/properties/books/oneOf/0")).to.deep.equal({ title: "Book v1" });
    expect(get(schema, "#/properties/books/oneOf/1")).to.deep.equal({ title: "Book v1 (mid=1)" });
    expect(get(schema, "#/properties/books/oneOf/2")).to.deep.equal({ title: "Book v2" });

    expect(schema).toMatchSnapshot();
    expect(parser.$refs.propertyMap).to.deep.equal({
      "#/properties/books": path.abs("specs/usage/definitions/design-library.json") + "#/definitions/Books",
      "#/properties/books/oneOf/0": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/book.v1.json?deref=bundle",
      "#/properties/books/oneOf/1": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/book.v1.json?deref=bundle&mid=1",
      "#/properties/books/oneOf/2": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/book.v2.json?deref=bundle&mid=1",
      "#/properties/design-library": path.abs("specs/usage/definitions/design-library.json"),
      "#/properties/design-library/definitions/Books": "http://jakub.stoplight-local.com:8080/api/v1/projects/jakub/my-project/nodes/reference/books.json?deref=bundle&mid=1",
    });
  });
});
