export interface ExtractorResponse {
  intent: "activity" | "question" | "unknown";
  activity_type: "fertilization" | "spraying" | "irrigation" | "harvesting" | "planting" | null;
  farm: string | null;
  crop: string | null;
  product: string | null;
  quantity: string | null;
  date: string | null;
}

export interface ExtractorRequest {
  message: string;
  farmerStatus: any;
  history: any[];
  audioData?: { base64: string; mimeType: string };
}

export interface ResponderRequest {
  message: string;
  status: "idle" | "collecting" | "completed" | "cancelled";
  intent: "activity" | "question" | "unknown";
  pendingData: any;
  nextMissingField: string | null;
  farmerStatus: any;
  history: any[];
}

export interface AIProvider {
  name: string;
  extract(request: ExtractorRequest): Promise<ExtractorResponse>;
  respond(request: ResponderRequest): Promise<string>;
}
