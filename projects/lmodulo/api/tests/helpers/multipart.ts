import { randomBytes } from 'crypto';

export function buildMultipart(files: Array<{
  name: string;
  filename: string;
  content: Buffer;
  contentType: string;
}>): { body: Buffer; contentType: string } {
  const boundary = `----TestBoundary${randomBytes(8).toString('hex')}`;
  const parts: Buffer[] = [];

  for (const f of files) {
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${f.name}"; filename="${f.filename}"\r\nContent-Type: ${f.contentType}\r\n\r\n`
    ));
    parts.push(f.content);
    parts.push(Buffer.from('\r\n'));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));

  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`
  };
}

// Minimal valid 1×1 JPEG for avatar/logo upload tests
export const TINY_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDB' +
  'kSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAAR' +
  'CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA' +
  'AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAA' +
  'AAAAAAAA/9oADAMBAAIRAxEAPwCwABmX/9k=',
  'base64'
);
