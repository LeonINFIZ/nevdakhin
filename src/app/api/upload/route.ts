import { NextResponse } from 'next/server';
import { isAuthenticatedAdmin } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function POST(request: Request) {
  const isAdmin = await isAuthenticatedAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещен' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      const single = formData.get('file') as File;
      if (single) files.push(single);
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'Файл не передан' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];

    for (const file of files) {
      if (!file.name) continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean filename
      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const cleanName = path
        .basename(file.name, ext)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/gi, '_')
        .substring(0, 30);
      const filename = `${cleanName}-${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, buffer);
      uploadedUrls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0] || '',
      urls: uploadedUrls,
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
