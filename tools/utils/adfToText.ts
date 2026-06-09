type ADFNode = {
  type?: string;
  text?: string;
  content?: ADFNode[];
};

export function adfToText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;

  const parts: string[] = [];

  function walk(node: ADFNode): void {
    if (!node) return;

    if (node.text) {
      parts.push(node.text);
    }

    if (node.type === "paragraph" || node.type === "heading" || node.type === "listItem") {
      if (parts.length && !parts[parts.length - 1].endsWith("\n")) {
        parts.push("\n");
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }

    if (["paragraph", "heading", "listItem"].includes(node.type || "")) {
      if (parts.length && !parts[parts.length - 1].endsWith("\n")) {
        parts.push("\n");
      }
    }
  }

  walk(value as ADFNode);

  return parts
    .join("")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
