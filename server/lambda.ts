/** AWS Lambda (Function URL, payload v2) adapter for handleAssist. The response is buffered: the NDJSON lines arrive together. */
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleAssist } from './aiAssist';

interface UrlEvent {
  headers: Record<string, string | undefined>;
  body?: string;
  isBase64Encoded?: boolean;
  requestContext: { http: { method: string } };
}

class BufferedRes extends EventEmitter {
  statusCode = 200;
  headers: Record<string, string> = {};
  chunks: string[] = [];
  writableEnded = false;
  writableFinished = false;
  destroyed = false;
  done: Promise<void>;
  private resolve!: () => void;
  constructor() {
    super();
    this.done = new Promise((r) => (this.resolve = r));
  }
  setHeader(k: string, v: string) {
    this.headers[k.toLowerCase()] = v;
  }
  write(c: string) {
    this.chunks.push(c);
    return true;
  }
  end(c?: string) {
    if (c) this.chunks.push(c);
    this.writableEnded = this.writableFinished = true;
    this.emit('close');
    this.resolve();
  }
}

export async function handler(event: UrlEvent) {
  // CloudFront adds this header; direct hits on the Function URL are rejected
  if (!process.env.ORIGIN_SECRET || event.headers['x-origin-secret'] !== process.env.ORIGIN_SECRET) {
    return { statusCode: 403, body: '{"error":"forbidden"}' };
  }
  const raw = event.body ? Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8') : Buffer.alloc(0);
  const req = Object.assign(Readable.from([raw]), { method: event.requestContext.http.method }) as unknown as IncomingMessage;
  const res = new BufferedRes();
  await handleAssist(req, res as unknown as ServerResponse, {
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AWS_REGION: process.env.BEDROCK_REGION, // Lambda's own AWS_REGION is the function region, Bedrock lives elsewhere
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID, // the Lambda role's temporary credentials
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
  });
  await res.done;
  return { statusCode: res.statusCode, headers: res.headers, body: res.chunks.join('') };
}
