import type { MessageListItem, MessageValidationErrors } from "./messages";

export type MessageCreateResponse =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      message: string;
      errors?: MessageValidationErrors;
    };

export type MessageListResponse =
  | {
      ok: true;
      items: MessageListItem[];
    }
  | {
      ok: false;
      message: string;
    };

export type MessageMutationResponse =
  | {
      ok: true;
      item: MessageListItem;
    }
  | {
      ok: false;
      message: string;
    };

export type MessageDeleteResponse =
  | {
      ok: true;
      id: string;
    }
  | {
      ok: false;
      message: string;
    };
