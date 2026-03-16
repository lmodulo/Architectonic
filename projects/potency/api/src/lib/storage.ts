import { mkdir, writeFile, unlink } from 'fs/promises';
import { join, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Uploads dir: <project>/api/uploads/
const UPLOADS_ROOT = join(__dirname, '../../uploads');

interface StorageProvider {
  save(filename: string, buffer: Buffer, mimetype: string): Promise<string>;
  remove(url: string): Promise<void>;
}

class LocalStorage implements StorageProvider {
  private dir: string;

  constructor() {
    this.dir = join(UPLOADS_ROOT, 'products');
  }

  async save(filename: string, buffer: Buffer, _mimetype: string): Promise<string> {
    await mkdir(this.dir, { recursive: true });
    const safe = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext  = extname(safe) || '.bin';
    const name = `${Date.now()}-${safe.replace(ext, '')}${ext}`;
    await writeFile(join(this.dir, name), buffer);
    return `/uploads/products/${name}`;
  }

  async remove(url: string): Promise<void> {
    const filename = url.split('/').pop();
    if (!filename) return;
    try {
      await unlink(join(this.dir, filename));
    } catch {
      // file may already be gone — not an error
    }
  }
}

class S3Storage implements StorageProvider {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = process.env.AWS_BUCKET  ?? '';
    this.region = process.env.AWS_REGION  ?? 'us-east-1';
  }

  async save(filename: string, buffer: Buffer, mimetype: string): Promise<string> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    const client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId:     process.env.AWS_ACCESS_KEY_ID     ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? ''
      }
    });

    const safe = basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const ext  = extname(safe) || '.bin';
    const key  = `products/${Date.now()}-${safe.replace(ext, '')}${ext}`;

    await client.send(new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      Body:        buffer,
      ContentType: mimetype,
      ACL:         'public-read' as const
    }));

    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  async remove(_url: string): Promise<void> {
    // S3 object deletion is a separate concern; skip in phase 1
  }
}

function createStorageProvider(): StorageProvider {
  if (process.env.STORAGE_PROVIDER === 's3') return new S3Storage();
  return new LocalStorage();
}

export const storage = createStorageProvider();
