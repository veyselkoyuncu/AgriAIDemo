export interface Validator {
  validate: (value: any) => boolean;
  errorMessage: string;
}

export interface Normalizer {
  normalize: (value: any) => any;
}

export interface CompletionRule {
  isComplete: (activity: any) => boolean;
}

export interface ActivityRule {
  requiredFields: string[];
  optionalFields: string[];
  validators: Record<string, Validator[]>;
  normalizers: Record<string, Normalizer[]>;
  completionRule: CompletionRule;
}

const defaultCompletionRule: CompletionRule = {
  isComplete: (activity: any) => {
    return true; // We will handle this in Node.js engine by checking required fields
  }
};

export const ACTIVITY_RULES: Record<string, ActivityRule> = {
  planting: {
    requiredFields: ["farm", "crop", "date"],
    optionalFields: [],
    validators: {},
    normalizers: {},
    completionRule: defaultCompletionRule
  },
  irrigation: {
    requiredFields: ["farm", "crop", "quantity"],
    optionalFields: ["date"],
    validators: {},
    normalizers: {},
    completionRule: defaultCompletionRule
  },
  spraying: {
    requiredFields: ["farm", "crop", "product", "quantity"],
    optionalFields: ["date"],
    validators: {},
    normalizers: {},
    completionRule: defaultCompletionRule
  },
  fertilization: {
    requiredFields: ["farm", "crop", "product", "quantity"],
    optionalFields: ["date"],
    validators: {},
    normalizers: {},
    completionRule: defaultCompletionRule
  },
  harvesting: {
    requiredFields: ["farm", "crop", "quantity", "date"],
    optionalFields: [],
    validators: {},
    normalizers: {},
    completionRule: defaultCompletionRule
  }
};

export function getMissingFields(activity: any): string[] {
  if (!activity || !activity.activity_type) return ["activity_type"];
  
  const rule = ACTIVITY_RULES[activity.activity_type];
  if (!rule) return []; // Unknown activity type, no required fields

  const missing: string[] = [];
  for (const field of rule.requiredFields) {
    if (activity[field] === undefined || activity[field] === null || activity[field] === "") {
      missing.push(field);
    }
  }
  return missing;
}
