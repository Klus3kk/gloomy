import { strict as assert } from "node:assert";
import test from "node:test";

import { hashPassword, verifyPassword } from "../../lib/security/password";

test("hashPassword produces verifiable hashes", async () => {
  const plain = "super-secret";
  const { hash, salt } = await hashPassword(plain);

  assert.ok(hash.length > 0, "hash should not be empty");
  assert.ok(salt.length > 0, "salt should not be empty");

  const isValid = await verifyPassword(plain, salt, hash);
  assert.equal(isValid, true, "password should verify with original input");

  const isInvalid = await verifyPassword("incorrect", salt, hash);
  assert.equal(isInvalid, false, "password should not verify with wrong input");
});
