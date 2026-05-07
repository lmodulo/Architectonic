import { mkdir, writeFile, unlink } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = join(__dirname, '../../uploads');

interface StorageProvider {
  save(filename: string, buffer: Buffer, mimetype: string, folder?: string): Promise<string>;
  remove(url: string): Promise<void>;
}

class LocalStorage implements StorageProvider {
  async save(filename: string, buffer: Buffer, _mimetype: string, folder = 'products'): Promise<string> {
    const dir  = join(UPLOADS_ROOT, folder);
    await mkdir(dir, { recursive: true });
    const safe = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext  = extname(safe) || '.bin';
    const name = `${Date.now()}-${safe.replace(ext, '')}${ext}`;
    await writeFile(join(dir, name), buffer);
    return `/uploads/${folder}/${name}`;
  }

  async remove(url: string): Promise<void> {
    const rel = url.replace(/^\/uploads\//, '');
    if (!rel || rel === url) return;
    try {
      await unlink(join(UPLOADS_ROOT, rel));
    } catch {
      // file may already be gone
    }
  }
}

class S3Storage implements StorageProvider {
  private bucket: string;
  private region: string;
  private endpoint: string | undefined;
  private baseUrl: string;
  private _client: any = null;

  constructor() {
    this.bucket   = process.env.AWS_BUCKET   ?? '';
    this.region   = process.env.AWS_REGION   ?? 'us-east-1';
    this.endpoint = process.env.S3_ENDPOINT  || undefined;
    const publicOrigin = process.env.S3_PUBLIC_URL;
    this.baseUrl = publicOrigin
      ? `${publicOrigin}/${this.bucket}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }

  private async getClient() {
    if (this._client) return this._client;
    const { S3Client } = await import('@aws-sdk/client-s3');
    this._client = new S3Client({
      region: this.region,
      ...(this.endpoint ? { endpoint: this.endpoint, forcePathStyle: true } : {}),
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID     ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
      }
    });
    return this._client;
  }

  async save(filename: string, buffer: Buffer, mimetype: string, folder = 'products'): Promise<string> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();
    const safe   = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext    = extname(safe) || '.bin';
    const key    = `${folder}/${Date.now()}-${safe.replace(ext, '')}${ext}`;
    await client.send(new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      Body:        buffer,
      ContentType: mimetype
    }));
    return `${this.baseUrl}/${key}`;
  }

  async remove(url: string): Promise<void> {
    if (!url || !url.startsWith(this.baseUrl)) return;
    const key = url.slice(this.baseUrl.length + 1);
    if (!key) return;
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    const client = await this.getClient();
    try {
      await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      // best effort
    }
  }
}

function createStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === 's3') return new S3Storage();
  return new LocalStorage();
}

export const storage = createStorageProvider();
