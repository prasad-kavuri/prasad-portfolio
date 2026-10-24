export const MAX_JSON_BODY_BYTES = 1024 * 1024;

export class RequestBodyTooLarge extends Error {
  constructor() {
    super('Request body too large');
    this.name = 'RequestBodyTooLarge';
  }
}

/** Enforce actual bytes, including chunked requests and untrusted length headers. */
export async function readBoundedText(request: Pick<Request, 'headers' | 'body'>, maxBytes = MAX_JSON_BODY_BYTES): Promise<string> {
  const length = request.headers.get('content-length');
  if (length && /^\d+$/.test(length) && Number(length) > maxBytes) {
    await request.body?.cancel().catch(() => {});
    throw new RequestBodyTooLarge();
  }
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const chunks: string[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel().catch(() => {});
        throw new RequestBodyTooLarge();
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
    return chunks.join('');
  } finally {
    reader.releaseLock();
  }
}
