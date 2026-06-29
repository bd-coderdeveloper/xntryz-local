import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://dummy.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy')
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const pageId = formData.get('pageId') as string;
    const accessToken = formData.get('accessToken') as string;
    const swipeUpLink = formData.get('swipeUpLink') as string;

    if (!file || !pageId || !accessToken) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Step 1: Upload photo as unpublished to the page
    const uploadFormData = new FormData();
    uploadFormData.append('source', file, file.name || 'image.jpg');
    uploadFormData.append('published', 'false');
    uploadFormData.append('access_token', accessToken);

    const uploadRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photos`, {
      method: 'POST',
      body: uploadFormData
    });

    const uploadData = await uploadRes.json();

    if (!uploadRes.ok || !uploadData.id) {
      console.error('Facebook Photo Upload Error:', uploadData);
      return NextResponse.json({ 
        success: false, 
        error: uploadData.error?.message || 'Failed to upload photo to Facebook' 
      }, { status: 400 });
    }

    const photoId = uploadData.id;

    // Step 2: Publish the story using the photo_id
    const storyFormData = new FormData();
    storyFormData.append('photo_id', photoId);
    storyFormData.append('access_token', accessToken);
    if (swipeUpLink) {
      storyFormData.append('swipe_up_link', swipeUpLink);
    }

    const fbRes = await fetch(`https://graph.facebook.com/v21.0/${pageId}/photo_stories`, {
      method: 'POST',
      body: storyFormData
    });

    const fbData = await fbRes.json();

    if (fbRes.ok && fbData.id) {
      return NextResponse.json({ success: true, data: fbData });
    } else {
      console.error('Facebook Story API Error:', fbData);
      return NextResponse.json({ 
        success: false, 
        error: fbData.error?.message || 'Failed to publish story to Facebook' 
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Story upload error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
