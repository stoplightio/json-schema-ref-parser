/* eslint-disable camelcase */
"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const nock = require("nock");
const { getDefaultsForOldJsonSchema } = require("../../../lib/bundle/defaults");
const { getDefaultsForOAS2, getDefaultsForOAS3 } = require("../../../lib/bundle/defaults");

describe("Custom bundling roots", () => {
  describe("reference files", () => {
    before(() => {
      nock("https://example.com")
        .persist(true)
        .get("/api/nodes.raw/")
        .query({
          srn: "org/proj/data-model-dictionary/reference/common/models/Airport",
        })
        .reply(200, require("./reference/mocks/airport-unmasked.json"));

      nock("https://example.com")
        .persist(true)
        .get("/api/nodes.raw/")
        .query({
          srn: "org/proj/data-model-dictionary/reference/common/models/Airport",
          mid: "123"
        })
        .reply(200, require("./reference/mocks/airport-masked.json"));
    });

    after(() => {
      nock.cleanAll();
    });

    it("should allow to customize bundling roots for OAS2", async () => {
      let parser = new $RefParser();

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-2.json"), {
        bundle: getDefaultsForOAS2(),
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-2-bundled.js"));
    });

    it("should allow to customize bundling roots for OAS3", async () => {
      let parser = new $RefParser();

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-3.json"), {
        bundle: getDefaultsForOAS3(),
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-3.bundled.js"));
    });
  });

  it("mixed inline", async () => {
    let parser = new $RefParser();

    const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/mixed-inline.json"), {
      bundle: getDefaultsForOAS2(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      swagger: "2.0",
      definitions: {
        Id: {
          in: "path",
          name: "id",
          required: true,
          type: "number"
        },
      },
      paths: {
        "/flight/{id}": {
          get: {
            responses: {
              200: {
                schema: {
                  $ref: "#/definitions/Id"
                }
              },
              400: {
                schema: {
                  foo: {
                    $ref: "#/definitions/Id/type"
                  }
                }
              }
            }
          },
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              type: "number"
            }
          ]
        }
      },
    });
  });

  it("should handle $refs whose parents were remapped", async () => {
    nock("http://localhost:8080")
      .get("/api/nodes.raw/")
      .query({
        srn: "gh/stoplightio/test/Book.v1.yaml"
      })
      .reply(200, {
        properties: {
          author: {
            $ref: "#/definitions/Book_Author"
          },
          publisher: {
            properties: {
              city: {
                $ref: "#/definitions/City"
              }
            }
          }
        },
        definitions: {
          City: {
            properties: {
              street: {
                type: "string"
              }
            }
          },
          Book_Author: {
            properties: {
              name: {
                type: "string"
              },
              contact: {
                properties: {
                  name: {
                    $ref: "#/definitions/Book_Author/properties/name"
                  },
                  address: {
                    street: {
                      $ref: "#/definitions/City/properties/street"
                    },
                  }
                }
              }
            }
          }
        },
      });

    const model = {
      properties: {
        id: {
          type: "string"
        },
        book: {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v1.yaml"
        }
      }
    };

    let parser = new $RefParser();

    const schema = await parser.bundle(model, {
      bundle: getDefaultsForOldJsonSchema(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        "Book.v1": {
          definitions: {},
          properties: {
            author: {
              $ref: "#/definitions/Book.v1_Book_Author"
            },
            publisher: {
              properties: {
                city: {
                  $ref: "#/definitions/Book.v1_City"
                }
              }
            }
          }
        },
        "Book.v1_Book_Author": {
          properties: {
            contact: {
              properties: {
                address: {
                  street: {
                    $ref: "#/definitions/Book.v1_City/properties/street"
                  }
                },
                name: {
                  $ref: "#/definitions/Book.v1_Book_Author/properties/name"
                }
              }
            },
            name: {
              type: "string"
            }
          }
        },
        "Book.v1_City": {
          properties: {
            street: {
              type: "string"
            }
          }
        },
      },
      properties: {
        book: {
          $ref: "#/definitions/Book.v1"
        },
        id: {
          type: "string"
        }
      }
    });
  });

  it("should append mid to the key", async () => {
    nock("http://localhost:8080")
      .get("/api/nodes.raw/")
      .query({
        srn: "gh/stoplightio/test/Book.v1.yaml",
        mid: "2",
      })
      .reply(200, {
        properties: {
          id: {
            type: "string"
          }
        }

      });

    const model = {
      properties: {
        id: {
          type: "string"
        },
        book: {
          $ref: "http://localhost:8080/api/nodes.raw/?srn=gh/stoplightio/test/Book.v1.yaml&mid=2"
        }
      }
    };

    let parser = new $RefParser();

    const schema = await parser.bundle(model, {
      bundle: getDefaultsForOldJsonSchema(),
    });

    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal({
      definitions: {
        "Book.v1_m2": {
          properties: {
            id: {
              type: "string"
            }
          }
        }
      },
      properties: {
        book: {
          $ref: "#/definitions/Book.v1_m2"
        },
        id: {
          type: "string"
        }
      }
    });
  });
});
