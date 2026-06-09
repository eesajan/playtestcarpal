import type { ParsedTestCase } from "./types";

function section(text: string, start: RegExp, end?: RegExp): string {
  const startMatch = text.match(start);
  if (!startMatch || startMatch.index === undefined) return "";

  const from = startMatch.index + startMatch[0].length;
  const rest = text.slice(from);
  const endMatch = end ? rest.match(end) : null;
  const to = endMatch && endMatch.index !== undefined ? endMatch.index : rest.length;

  return rest.slice(0, to).trim();
}

function cleanLine(line: string): string {
  return line
    .replace(/^[-*•]\s*/, "")
    .replace(/^\d+[.)]\s*/, "")
    .trim();
}

function splitSteps(stepsBlock: string): string[] {
  return stepsBlock
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean)
    .flatMap((line) => {
      const sentenceSplit = line.split(/(?<=\.)\s+(?=[A-Z])/);
      return sentenceSplit.map(cleanLine).filter(Boolean);
    });
}

export function parseDescription(params: {
  key: string;
  title: string;
  descriptionText: string;
}): ParsedTestCase {
  const { key, title, descriptionText } = params;

  const preReq = section(
    descriptionText,
    /pre[- ]?req(?:uisite)?s?\s*:/i,
    /\n\s*steps\s*:/i
  );

  const stepsBlock = section(
    descriptionText,
    /steps\s*:/i,
    /\n\s*expected\s*result\s*:/i
  );

  const expectedResult = section(
    descriptionText,
    /expected\s*result\s*:/i
  );

  return {
    key,
    title,
    preReq,
    stepsText: splitSteps(stepsBlock),
    expectedResult
  };
}
