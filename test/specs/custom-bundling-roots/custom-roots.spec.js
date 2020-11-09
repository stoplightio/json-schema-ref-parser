"use strict";

const { expect } = require("chai");
const $RefParser = require("../../..");
const path = require("../../utils/path");
const nock = require("nock");
const url = require("../../../lib/util/url");
const { safePointerToPath } = require("../../../lib/util/url");
const { createSuggester } = require("../../../lib/bundle/util/suggestName");

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

      let suggestions = createSuggester("#/definitions");

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-2.json"), {
        bundle: {
          generateKey (schema, file, hash) {
            if (!url.isFileSystemPath(file)) {
              return null;
            }

            if (hash !== "#" && hash !== null) {
              return suggestions.suggestNameForPointer(schema, suggestions.getExistingSuggestion(file) + hash.slice(1));
            }

            return suggestions.suggestNameForFilePath(schema, file);
          },
          shouldInline (pathFromRoot) {
            const parsed = safePointerToPath(pathFromRoot);
            return parsed.length === 0 || (parsed[0] !== "definitions" && !parsed.includes("schema"));
          }
        }
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-2-bundled.js"));
    });

    it("should allow to customize bundling roots for OAS3", async () => {
      let parser = new $RefParser();

      let suggestions = createSuggester("#/components/schemas");

      const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/reference/openapi-3.json"), {
        bundle: {
          generateKey (schema, file, hash) {
            if (!url.isFileSystemPath(file)) {
              return null;
            }

            if (hash !== "#" && hash !== null) {
              hash = hash.replace(/\/definitions\//g, "/");
              return suggestions.suggestNameForPointer(schema, suggestions.getExistingSuggestion(file) + hash.slice(1));
            }

            return suggestions.suggestNameForFilePath(schema, file);
          },
          shouldInline (pathFromRoot) {
            if (pathFromRoot.startsWith("#/components/schema")) {
              return false;
            }

            if (pathFromRoot.endsWith("/schema") || pathFromRoot.includes("/schema/")) {
              return false;
            }

            return true;
          }
        }
      });

      expect(schema).to.equal(parser.schema);
      expect(schema).to.deep.equal(require("./reference/openapi-3.bundled.js"));
    });
  });

  it("mixed inline", async () => {
    let parser = new $RefParser();

    let suggestions = createSuggester("#/definitions");

    const schema = await parser.bundle(path.rel("specs/custom-bundling-roots/mixed-inline.json"), {
      bundle: {

        generateKey (schema, file, hash) {
          if (!url.isFileSystemPath(file)) {
            return null;
          }

          if (hash !== "#" && hash !== null) {
            return suggestions.suggestNameForPointer(schema, suggestions.getExistingSuggestion(file) + hash.slice(1));
          }

          return suggestions.suggestNameForFilePath(schema, file);
        },
        shouldInline (pathFromRoot) {
          const parsed = safePointerToPath(pathFromRoot);
          return parsed.length === 0 || (parsed[0] !== "definitions" && !parsed.includes("schema"));
        }
      }
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
        }
      },
      paths: {
        "/flight/{id}": {
          get: {
            responses: {
              200: {
                schema: {
                  $ref: "#/definitions/Id"
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
});
