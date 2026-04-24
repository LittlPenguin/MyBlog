import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export type StoredMessage = {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export type MessageStatus = "unread" | "read";

export type MessageListItem = StoredMessage & {
  status: MessageStatus;
};

export type MessageCreateInput = {
  name: string;
  email: string;
  body: string;
};

export type MessageValidationErrors = Partial<Record<"name" | "email" | "body", string>>;

export type MessageValidationResult =
  | {
      ok: true;
      value: MessageCreateInput;
    }
  | {
      ok: false;
      message: string;
      errors: MessageValidationErrors;
    };

const MESSAGE_FILE_SUFFIX = ".json";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function normalizeLineEndings(value: string) {
  return value.replace(/\r\n?/g, "\n");
}

function trimInput(value: string | undefined) {
  return value?.trim() ?? "";
}

function toMessageStatus(readAt: string | null): MessageStatus {
  return readAt ? "read" : "unread";
}

function byCreatedAtDesc(a: StoredMessage, b: StoredMessage) {
  return +new Date(b.createdAt) - +new Date(a.createdAt);
}

function toMessageListItem(message: StoredMessage): MessageListItem {
  return {
    ...message,
    status: toMessageStatus(message.readAt),
  };
}

export function messageRootDir(rootDir = process.cwd()) {
  return path.join(rootDir, "src", "content", "messages");
}

export function messageFilePath(rootDir: string, id: string) {
  return path.join(rootDir, `${id}${MESSAGE_FILE_SUFFIX}`);
}

export function validateMessageInput(input: Partial<MessageCreateInput>): MessageValidationResult {
  const name = trimInput(input.name);
  const email = trimInput(input.email).toLowerCase();
  const body = normalizeLineEndings(trimInput(input.body));
  const errors: MessageValidationErrors = {};

  if (!name) {
    errors.name = "Name is required.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email must be valid.";
  }

  if (!body) {
    errors.body = "Message is required.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      message: "Please complete the required fields.",
      errors,
    };
  }

  return {
    ok: true,
    value: {
      name,
      email,
      body,
    },
  };
}

export function createStoredMessage(input: MessageCreateInput, now = () => new Date().toISOString()): StoredMessage {
  return {
    id: randomUUID(),
    name: input.name,
    email: input.email,
    body: input.body,
    createdAt: now(),
    readAt: null,
  };
}

async function readJsonFile(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as StoredMessage;
}

function assertStoredMessage(value: StoredMessage): asserts value is StoredMessage {
  assert.equal(typeof value.id, "string");
  assert.equal(typeof value.name, "string");
  assert.equal(typeof value.email, "string");
  assert.equal(typeof value.body, "string");
  assert.equal(typeof value.createdAt, "string");
  assert.equal(value.readAt === null || typeof value.readAt === "string", true);
}

export async function saveStoredMessage({
  rootDir,
  message,
}: {
  rootDir: string;
  message: StoredMessage;
}) {
  const stored: StoredMessage = {
    id: message.id,
    name: message.name,
    email: message.email,
    body: message.body,
    createdAt: message.createdAt,
    readAt: message.readAt,
  };

  await fs.mkdir(rootDir, { recursive: true });
  await fs.writeFile(messageFilePath(rootDir, stored.id), JSON.stringify(stored, null, 2), "utf8");
  return toMessageListItem(stored);
}

export async function createMessage({
  rootDir,
  input,
  now,
}: {
  rootDir: string;
  input: MessageCreateInput;
  now?: () => string;
}) {
  const message = createStoredMessage(input, now);
  return saveStoredMessage({ rootDir, message });
}

export async function readMessageById({
  rootDir,
  id,
}: {
  rootDir: string;
  id: string;
}): Promise<MessageListItem | null> {
  try {
    const message = await readJsonFile(messageFilePath(rootDir, id));
    assertStoredMessage(message);
    return toMessageListItem(message);
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function readAllMessages(rootDir: string): Promise<MessageListItem[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true }).catch(() => []);
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(MESSAGE_FILE_SUFFIX))
    .map((entry) => path.join(rootDir, entry.name));

  const messages = await Promise.all(
    files.map(async (filePath) => {
      const message = await readJsonFile(filePath);
      assertStoredMessage(message);
      return message;
    }),
  );

  return messages.sort(byCreatedAtDesc).map(toMessageListItem);
}

export async function markMessageAsRead({
  rootDir,
  id,
  now = () => new Date().toISOString(),
}: {
  rootDir: string;
  id: string;
  now?: () => string;
}): Promise<MessageListItem | null> {
  const current = await readMessageById({ rootDir, id });
  if (!current) {
    return null;
  }

  if (current.readAt) {
    return current;
  }

  const { status: _status, ...stored } = current;
  const next: StoredMessage = {
    ...stored,
    readAt: now(),
  };
  return saveStoredMessage({ rootDir, message: next });
}

export async function deleteMessage({
  rootDir,
  id,
}: {
  rootDir: string;
  id: string;
}) {
  try {
    await fs.unlink(messageFilePath(rootDir, id));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
