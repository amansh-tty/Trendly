import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function uploadImage(base64Image: string, folder = 'wardrobe'): Promise<string> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(uploadDir, { recursive: true });

  const filename = `${randomUUID()}.jpg`;
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${folder}/${filename}`;
}
