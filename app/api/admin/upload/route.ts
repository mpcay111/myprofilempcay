import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';
import { MEDIA_BUCKET, supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

/**
 * Image upload endpoint for the admin.
 *
 * Route handler rather than a server action because server actions cap request
 * bodies well below a useful image size, and raising that cap globally to suit
 * one upload would be the wrong trade.
 *
 * The service role key never leaves this process — the browser posts the file
 * here and gets back a public URL, and at no point does it hold a Supabase
 * credential.
 */

export const runtime = 'nodejs';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB, matching the bucket's own limit

/** Magic-number signatures. The declared MIME type is attacker-controlled, so
 *  it is checked against the actual leading bytes rather than believed. */
const SIGNATURES: Array<{ mime: string; ext: string; test: (b: Uint8Array) => boolean }> = [
  {
    mime: 'image/png',
    ext: 'png',
    test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/jpeg',
    ext: 'jpg',
    test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    mime: 'image/gif',
    ext: 'gif',
    test: (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  },
];

function detect(bytes: Uint8Array) {
  return SIGNATURES.find((s) => s.test(bytes)) ?? null;
}

export async function POST(request: NextRequest) {
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Supabase is not configured, so there is nowhere to store the image.' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Malformed upload.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file was attached.' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `That image is ${(file.size / 1048576).toFixed(1)} MB. The limit is 10 MB.` },
      { status: 413 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = detect(bytes);
  if (!kind) {
    return NextResponse.json(
      { error: 'That is not a PNG, JPEG, WebP or GIF image.' },
      { status: 415 },
    );
  }

  // Name the object ourselves. The uploaded filename is untrusted and could
  // carry path separators, control characters, or a misleading extension.
  const objectName = `${crypto.randomUUID()}.${kind.ext}`;

  const { error } = await supabaseAdmin()
    .storage.from(MEDIA_BUCKET)
    .upload(objectName, bytes, { contentType: kind.mime, upsert: false });

  if (error) {
    return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
  }

  const { data } = supabaseAdmin().storage.from(MEDIA_BUCKET).getPublicUrl(objectName);

  // Intrinsic dimensions are read client-side before upload and echoed back, so
  // the editor can store them alongside the URL for next/image.
  return NextResponse.json({ url: data.publicUrl, name: objectName });
}
