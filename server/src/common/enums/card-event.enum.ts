const CardEvent = {
  CREATE: "card:create",
  REORDER: "card:reorder",
  DELETE: "card:delete",
  RENAME: "card:rename",
  CHANGE_DESCRIPTION: "card:change-description",
  DUPLICATE: "card:duplicate",
  UNDO: "card:undo",
  REDO: "card:redo"
} as const;

export { CardEvent };
