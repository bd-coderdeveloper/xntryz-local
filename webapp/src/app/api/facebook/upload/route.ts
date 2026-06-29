import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, targetId, base64, type, published = true, description = '' } = body;

    if (!token || !targetId || !base64 || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const buffer = Buffer.from(base64, 'base64');
    const formData = new FormData();
    formData.append('access_token', token);

    let apiUrl = '';

    if (type === 'photo') {
      apiUrl = `https://graph.facebook.com/v21.0/${targetId}/photos`;
      const file = new File([new Uint8Array(buffer)], 'upload.jpg', { type: 'image/jpeg' });
      formData.append('source', file);

      if (targetId === 'me') {
        formData.append('published', 'true');
        formData.append('privacy', '{"value":"SELF"}');
      } else {
        formData.append('published', published ? 'true' : 'false');
      }

      if (description) {
        formData.append('message', description);
      }
    } else if (type === 'video') {
      apiUrl = `https://graph.facebook.com/v21.0/${targetId}/videos`;
      const blob = new Blob([buffer], { type: 'video/mp4' });
      formData.append('source', blob, 'video.mp4');

      if (description) {
        formData.append('description', description);
      }
    } else {
      return NextResponse.json({ error: 'Invalid type specified' }, { status: 400 });
    }

    const fbRes = await fetch(apiUrl, {
      method: 'POST',
      body: formData
    });

    const parsed = await fbRes.json();

    if (!fbRes.ok || parsed.error) {
      console.error('FB Upload Graph API Error:', JSON.stringify(parsed.error, null, 2));
      return NextResponse.json({
        error: parsed.error?.message || 'Graph API Error',
        details: parsed.error // Send full error back
      }, { status: fbRes.status || 500 });
    }

    return NextResponse.json({ id: parsed.id, success: true });
  } catch (err: any) {
    console.error('FB Upload Proxy Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}