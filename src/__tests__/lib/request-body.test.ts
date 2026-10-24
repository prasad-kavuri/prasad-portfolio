import { expect, it, vi } from 'vitest';
import { MAX_JSON_BODY_BYTES, readBoundedText, RequestBodyTooLarge } from '@/lib/request-body';

function streamed(chunks: Uint8Array<ArrayBuffer>[], headers: Record<string, string> = {}, cancel = vi.fn()) {
  const pull = vi.fn((controller: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>) => {
    const chunk = chunks.shift();
    if (chunk) controller.enqueue(chunk); else controller.close();
  });
  const body = new ReadableStream<Uint8Array<ArrayBuffer>>({ pull, cancel }, { highWaterMark: 0 });
  return { request: { body, headers: new Headers(headers) }, cancel, pull };
}

it('accepts the exact byte boundary and decodes multibyte text across chunks', async () => {
  const bytes = new TextEncoder().encode('A\u20acB');
  const { request } = streamed([bytes.slice(0, 2), bytes.slice(2)]);
  expect(await readBoundedText(request, 5)).toBe('A\u20acB');
  expect(await readBoundedText(new Request('https://example.com'))).toBe('');
});

const lengthHeaders: Record<string, string>[] = [{}, { 'content-length': '1' }, { 'content-length': 'invalid' }];
it.each(lengthHeaders)('bounds actual bytes regardless of declared length: %j', async (headers) => {
  const { request, cancel, pull } = streamed([new Uint8Array(3), new Uint8Array(3), new Uint8Array(3)], headers);
  await expect(readBoundedText(request, 5)).rejects.toBeInstanceOf(RequestBodyTooLarge);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(pull).toHaveBeenCalledTimes(2);
  expect(request.body?.locked).toBe(false);
});

it('rejects an oversized declared body without reading it', async () => {
  const { request, cancel, pull } = streamed([new Uint8Array(3)], { 'content-length': '100' });
  await expect(readBoundedText(request, 5)).rejects.toBeInstanceOf(RequestBodyTooLarge);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(pull).not.toHaveBeenCalled();
  await expect(readBoundedText({ body: null, headers: new Headers({ 'content-length': '100' }) }, 5)).rejects.toBeInstanceOf(RequestBodyTooLarge);
});

const cancellationHeaders: Record<string, string>[] = [{}, { 'content-length': '100' }];
it.each(cancellationHeaders)('preserves the size error if cancellation fails: %j', async (headers) => {
  const { request } = streamed([new Uint8Array(6)], headers, vi.fn(() => { throw new Error('cancel failed'); }));
  await expect(readBoundedText(request, 5)).rejects.toBeInstanceOf(RequestBodyTooLarge);
});

it('propagates read failures and rejects invalid UTF-8', async () => {
  const body = new ReadableStream({ start(controller) { controller.error(new Error('read failed')); } });
  const init: RequestInit & { duplex: 'half' } = { method: 'POST', body, duplex: 'half' };
  await expect(readBoundedText(new Request('https://example.com', init))).rejects.toThrow('read failed');
  const { request } = streamed([new Uint8Array([255])]);
  await expect(readBoundedText(request)).rejects.toThrow();
});

it('supports the maximum escaped conversation history within the shared cap', async () => {
  const messages = Array.from({ length: 20 }, () => ({ role: 'assistant', content: '\u0001'.repeat(8192) }));
  const text = JSON.stringify({ messages });
  expect(new TextEncoder().encode(text).length).toBeLessThan(MAX_JSON_BODY_BYTES);
  expect(await readBoundedText(new Request('https://example.com', { method: 'POST', body: text }))).toBe(text);
});
