import { AskProductConfigInternal } from "./ask-product.config";

export interface AskProductResponse {
  answer: string;
  sources?: AskProductSource[];
  error?: boolean;
}

export interface AskProductSource {
  documentId?: string;
  name: string;
  downloadUrl?: string;

  //TODO: remove this after backend is fixed
  document_id?: string;
  download_url?: string;
}

export interface AskProductQuestion {
  productCode: string;
  question: string;
  catalogID?: string;
  catalogVersion?: string;
}

export interface AskProductChatMessage {
  message: string;
  source: 'user' | 'assistant';
  sources?: AskProductSource[];
  timestamp: number;
  status?: string;
}

export interface AskProductServerSideConfig {
  //in fact this is only consumed destination
  askProductDestination?: AskProductConfigInternal,
  askProductContextCharacterLimit?: number,
  askProductContextMessageWindow?: number,
}