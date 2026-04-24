import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtemp, readFile, stat } from "node:fs/promises";
import test from "node:test";
import {
  createMessage,
  deleteMessage,
  markMessageAsRead,
  messageFilePath,
  messageRootDir,
  readAllMessages,
  validateMessageInput,
} from "./messages.ts";

test("messageRootDir points to src/content/messages under the current root", () => {
  assert.equal(
    messageRootDir("/workspace/demo"),
    path.join("/workspace/demo", "src", "content", "messages"),
  );
});

test("validateMessageInput requires name, valid email, and body", () => {
  const invalid = validateMessageInput({
    name: "",
    email: "bad",
    body: "",
  });

  assert.equal(invalid.ok, false);
  if (invalid.ok) {
    return;
  }

  assert.deepEqual(invalid.errors, {
    name: "Name is required.",
    email: "Email must be valid.",
    body: "Message is required.",
  });
});

test("createMessage writes a single json file and returns unread status", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "myblog-messages-"));
  const item = await createMessage({
    rootDir,
    input: {
      name: "Aster",
      email: "aster@example.com",
      body: "Hello from the archive.",
    },
    now: () => "2026-04-24T10:00:00.000Z",
  });

  assert.equal(item.status, "unread");
  assert.equal(item.readAt, null);

  const persisted = JSON.parse(await readFile(messageFilePath(rootDir, item.id), "utf8"));
  assert.equal(persisted.name, "Aster");
  assert.equal(persisted.email, "aster@example.com");
  assert.equal(persisted.createdAt, "2026-04-24T10:00:00.000Z");
});

test("readAllMessages returns newest messages first", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "myblog-message-sort-"));

  const older = await createMessage({
    rootDir,
    input: {
      name: "Older",
      email: "older@example.com",
      body: "First",
    },
    now: () => "2026-04-24T09:00:00.000Z",
  });

  const newer = await createMessage({
    rootDir,
    input: {
      name: "Newer",
      email: "newer@example.com",
      body: "Second",
    },
    now: () => "2026-04-24T11:00:00.000Z",
  });

  const items = await readAllMessages(rootDir);
  assert.deepEqual(
    items.map((item) => item.id),
    [newer.id, older.id],
  );
});

test("markMessageAsRead flips unread messages to read and is idempotent", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "myblog-message-read-"));
  const created = await createMessage({
    rootDir,
    input: {
      name: "Aster",
      email: "aster@example.com",
      body: "Hello from the archive.",
    },
    now: () => "2026-04-24T10:00:00.000Z",
  });

  const read = await markMessageAsRead({
    rootDir,
    id: created.id,
    now: () => "2026-04-24T12:00:00.000Z",
  });

  assert.equal(read?.status, "read");
  assert.equal(read?.readAt, "2026-04-24T12:00:00.000Z");

  const readAgain = await markMessageAsRead({
    rootDir,
    id: created.id,
    now: () => "2026-04-24T13:00:00.000Z",
  });

  assert.equal(readAgain?.readAt, "2026-04-24T12:00:00.000Z");

  const persisted = JSON.parse(await readFile(messageFilePath(rootDir, created.id), "utf8"));
  assert.equal("status" in persisted, false);
});

test("deleteMessage removes the stored file and list entry", async () => {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "myblog-message-delete-"));
  const created = await createMessage({
    rootDir,
    input: {
      name: "Aster",
      email: "aster@example.com",
      body: "Hello from the archive.",
    },
    now: () => "2026-04-24T10:00:00.000Z",
  });

  const deleted = await deleteMessage({
    rootDir,
    id: created.id,
  });

  assert.equal(deleted, true);
  await assert.rejects(stat(messageFilePath(rootDir, created.id)));

  const items = await readAllMessages(rootDir);
  assert.equal(items.length, 0);
});
