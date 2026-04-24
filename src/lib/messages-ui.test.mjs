import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();

async function readWorkspaceFile(relativePath) {
  return readFile(path.join(repoRoot, relativePath), "utf8");
}

test("about page renders the message form entry point", async () => {
  const page = await readWorkspaceFile("src/app/about/page.tsx");

  assert.match(page, /import\s+\{\s*MessageForm\s*\}\s+from\s+"\.\/message-form"/);
  assert.match(page, /<MessageForm\s*\/>/);
});

test("message form submits name, email, and body to the public messages API", async () => {
  const form = await readWorkspaceFile("src/app/about/message-form.tsx");

  assert.match(form, /fetch\("\/api\/messages"/);
  assert.match(form, /name:\s*form\.name/);
  assert.match(form, /email:\s*form\.email/);
  assert.match(form, /body:\s*form\.body/);
});

test("editor compose panel exposes a messages button", async () => {
  const sections = await readWorkspaceFile("src/app/editor/editor-sections.tsx");

  assert.match(sections, /onOpenMessages:\s*\(\)\s*=>\s*void/);
  assert.match(sections, /查看留言/);
});

test("editor client switches between compose and messages without route changes", async () => {
  const client = await readWorkspaceFile("src/app/editor/editor-client.tsx");

  assert.match(client, /type EditorView = "compose" \| "messages"/);
  assert.match(client, /setView\("messages"\)/);
  assert.match(client, /<EditorMessagePanel/);
});

test("message delete flow uses the shared delete confirm dialog", async () => {
  const panel = await readWorkspaceFile("src/app/editor/message-panel.tsx");
  const deleteButton = await readWorkspaceFile("src/components/site/admin-delete-button.tsx");

  assert.match(panel, /DeleteConfirmDialog/);
  assert.match(deleteButton, /DeleteConfirmDialog/);
});
