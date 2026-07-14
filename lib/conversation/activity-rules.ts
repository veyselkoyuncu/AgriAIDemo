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

export function normalizeEntityName(name: string | null | undefined): string | null {
  if (!name) return null;
  return name.trim().toLocaleLowerCase('tr-TR').normalize("NFC");
}

export function normalizeActivityType(rawType: string | null | undefined): string | null {
  if (!rawType) return null;
  const normalized = rawType.trim().toLowerCase();
  
  const aliases: Record<string, string> = {
    "spray": "spraying",
    "pesticide": "spraying",
    "pesticide_application": "spraying",
    "ilaclama": "spraying",
    "ilaçlama": "spraying",
    "fertilize": "fertilization",
    "fertilizing": "fertilization",
    "gubreleme": "fertilization",
    "gübreleme": "fertilization",
    "water": "irrigation",
    "watering": "irrigation",
    "sulama": "irrigation",
    "harvest": "harvesting",
    "hasat": "harvesting",
    "plant": "planting",
    "ekim": "planting",
    "dikim": "planting"
  };

  return aliases[normalized] || normalized;
}

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
