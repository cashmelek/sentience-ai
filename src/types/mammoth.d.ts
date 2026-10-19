// mammoth 1.13 tip dosyası paketlemiyor ve @types/mammoth registry'de bulunmuyor;
// yalnızca kullanılan API için minimal yerel deklarasyon.
declare module 'mammoth' {
  export interface MammothMessage {
    type: string;
    message: string;
  }

  export interface ExtractRawTextInput {
    arrayBuffer?: ArrayBuffer;
    buffer?: unknown;
    path?: string;
  }

  export interface ExtractRawTextResult {
    value: string;
    messages: MammothMessage[];
  }

  export function extractRawText(input: ExtractRawTextInput): Promise<ExtractRawTextResult>;
}
