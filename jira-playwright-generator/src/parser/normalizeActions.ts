import type { AutomationAction, NormalizedTestCase, ParsedTestCase } from "./types";

function normalizeText(text: string): string {
  return text
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2192/g, "->")
    .replace(/\u00e2\u20ac[\u0153\u009d]/g, '"')
    .replace(/\u00e2\u20ac[\u02dc\u2122]/g, "'")
    .replace(/\u00e2\u2020\u2019/g, "->");
}

function quotedText(text: string): string | undefined {
  const normalized = normalizeText(text);
  const match = normalized.match(/"([^"]+)"|'([^']+)'/);
  return match?.[1] || match?.[2];
}

function arrowValue(text: string): string | undefined {
  const match = normalizeText(text).match(/(?:->|=>|:|-)\s*(.+)$/);
  return match?.[1]?.trim();
}

function extractButtonText(text: string): string | undefined {
  const normalized = normalizeText(text);

  const buttonMatch = normalized.match(/(?:click|tap)\s+(?:on\s+)?(?:the\s+)?(?:"([^"]+)"|([a-z0-9 _-]+?))\s+(?:button|link|tab)\b/i);
  if (buttonMatch) return (buttonMatch[1] || buttonMatch[2]).trim();

  const quoted = quotedText(normalized);
  if (quoted && /(?:click|tap)/i.test(normalized)) return quoted;

  const clickMatch = normalized.match(/(?:click|tap)\s+(?:on\s+)?(?:the\s+)?([a-z0-9 _-]+?)(?:[.!,]|\s+on\s+that|\s*$)/i);
  if (clickMatch) return clickMatch[1].trim();

  return undefined;
}

function extractScreenHint(text: string): string | undefined {
  const normalized = normalizeText(text);

  const quotedScreen = normalized.match(/(?:screen|page)\s*[:\-]?\s*"([^"]+)"/i);
  if (quotedScreen) return quotedScreen[1].trim();

  const buttonOnQuoted = normalized.match(/(?:button|link|tab)\s+on\s+"([^"]+)"/i);
  if (buttonOnQuoted) return buttonOnQuoted[1].trim();

  const buttonOn = normalized.match(/(?:button|link|tab)\s+on\s+(.+?)\s*(?:screen|page)?\.?$/i);
  if (buttonOn) return buttonOn[1].replace(/[".]/g, "").trim();

  const onScreen = normalized.match(/(?:on|from)\s+(.+?)\s+(?:screen|page)/i);
  if (onScreen) return onScreen[1].replace(/[".]/g, "").trim();

  return undefined;
}

function extractVisibleExpectation(text: string): string | undefined {
  const normalized = normalizeText(text);
  const quoted = quotedText(normalized);
  if (quoted && /should\s+(appear|see|display|be visible)|screen|page/i.test(normalized)) return quoted;

  const screenMatch = normalized.match(/(?:^|\.\s*)([A-Za-z0-9 _-]+?)\s+(?:screen|page)\s+should\s+(?:appear|display|be visible)/i);
  if (screenMatch) return screenMatch[1].replace(/^the\s+/i, "").trim();

  const willAppearMatch = normalized.match(/(?:^|\.\s*)(?:a\s+|the\s+)?([A-Za-z0-9 _-]+?)\s+will\s+appear/i);
  if (willAppearMatch) return willAppearMatch[1].trim();

  const shouldSeeMatch = normalized.match(/(?:user\s+should\s+see|should\s+see|see)\s+(?:the\s+)?(.+?)(?:\s+screen|\s+page|$)/i);
  if (shouldSeeMatch) return shouldSeeMatch[1].trim();

  return undefined;
}

function parseFill(text: string): AutomationAction | undefined {
  const normalized = normalizeText(text);

  const emailMatch = normalized.match(/(?:enter|type|fill)\s+(?:the\s+)?email\s*(?:->|=>|:|-)?\s*(.+)$/i);
  if (emailMatch) {
    return { action: "fill", field: "email", value: emailMatch[1].trim() };
  }

  const passwordMatch = normalized.match(/(?:enter|type|fill)\s+(?:the\s+)?password\s*(?:->|=>|:|-)?\s*(.+)$/i);
  if (passwordMatch) {
    return { action: "fill", field: "password", value: passwordMatch[1].trim() };
  }

  const genericMatch = normalized.match(/(?:enter|type|fill)\s+(?:the\s+)?([a-z0-9 _-]+?)\s*(?:->|=>|:|-)\s*(.+)$/i);
  if (genericMatch) {
    return {
      action: "fill",
      field: genericMatch[1].trim(),
      value: genericMatch[2].trim()
    };
  }

  const value = arrowValue(normalized);
  if (/email/i.test(normalized) && value) return { action: "fill", field: "email", value };
  if (/password/i.test(normalized) && value) return { action: "fill", field: "password", value };

  return undefined;
}

function parseStep(text: string, index: number): AutomationAction[] {
  const actions: AutomationAction[] = [];
  const trimmed = normalizeText(text.trim());

  if (!trimmed) return actions;

  if (index === 0 && /launched|opened|open|launch|navigate|visit/i.test(trimmed)) {
    actions.push({ action: "goto", target: "/" });
  }

  const visible = extractVisibleExpectation(trimmed);
  if (visible && /should\s+(appear|see|display|be visible)|user\s+should\s+see|will\s+appear/i.test(trimmed)) {
    actions.push({ action: "expectVisible", text: visible });
  }

  const fill = parseFill(trimmed);
  if (fill) actions.push(fill);

  const clickText = /click|tap/i.test(trimmed) ? extractButtonText(trimmed) : undefined;
  if (clickText) {
    const screenHint = extractScreenHint(trimmed);
    actions.push({ action: "click", text: clickText, screenHint });
  }

  if (actions.length === 0) {
    actions.push({ action: "comment", text: `Manual/unmapped step: ${trimmed}` });
  }

  return actions;
}

function parseExpectedResult(text: string): AutomationAction | undefined {
  const normalized = normalizeText(text.trim());
  if (!normalized) return undefined;

  const partialText = normalized.match(/partial\s+text\s*:\s*"([^"]+)"/i);
  if (partialText) return { action: "expectPartialText", text: partialText[1].trim() };

  const quoted = quotedText(normalized);
  if (quoted) return { action: "expectPartialText", text: quoted };

  return { action: "expectVisible", text: normalized };
}

export function normalizeActions(testCase: ParsedTestCase): NormalizedTestCase {
  const actions = testCase.stepsText.flatMap((step, index) => parseStep(step, index));
  const expectedAction = parseExpectedResult(testCase.expectedResult);

  return {
    ...testCase,
    actions,
    expectedAction
  };
}
