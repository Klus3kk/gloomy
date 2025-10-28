import { strict as assert } from "node:assert";
import test from "node:test";

import { generateFileId } from "../../lib/utils/slugify";
import { generateShortToken } from "../../lib/utils/token";

test("generateFileId normalises title and appends suffix", () => {
  const generated = generateFileId("Hello World!");

  assert.match(generated, /^hello-world-[a-z0-9-]+$/);
});

test("generateFileId falls back to default when title empty", () => {
  const generated = generateFileId("   ");

  assert.match(generated, /^file-[a-z0-9-]+$/);
});

test("generateShortToken produces base62 token", () => {
  const token = generateShortToken(12);
  assert.equal(token.length, 12);
  assert.match(token, /^[a-z0-9]+$/);
});
