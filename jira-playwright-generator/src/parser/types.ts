export type ParsedTestCase = {
  key: string;
  title: string;
  preReq: string;
  stepsText: string[];
  expectedResult: string;
};

export type AutomationAction =
  | { action: "goto"; target: string }
  | { action: "click"; text: string; screenHint?: string }
  | { action: "fill"; field: string; value: string }
  | { action: "expectVisible"; text: string }
  | { action: "expectPartialText"; text: string }
  | { action: "comment"; text: string };

export type NormalizedTestCase = ParsedTestCase & {
  actions: AutomationAction[];
  expectedAction?: AutomationAction;
};
