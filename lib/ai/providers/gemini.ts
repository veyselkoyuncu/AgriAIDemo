import { AIProvider, ExtractorRequest, ExtractorResponse, ResponderRequest } from "../types";
import { extractFromMessage } from "../../gemini/extractor";
import { generateResponse } from "../../gemini/responder";

export class GeminiProvider implements AIProvider {
  get name(): string {
    return "Gemini";
  }

  async extract(request: ExtractorRequest): Promise<ExtractorResponse> {
    return extractFromMessage(
      request.message,
      request.farmerStatus,
      request.history,
      request.audioData,
      request.activeSession
    );
  }

  async respond(request: ResponderRequest): Promise<string> {
    return generateResponse(
      request.message,
      request.status,
      request.intent,
      request.pendingData,
      request.nextMissingField,
      request.farmerStatus,
      request.history
    );
  }
}
