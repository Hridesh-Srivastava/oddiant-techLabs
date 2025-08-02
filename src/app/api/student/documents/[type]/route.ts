import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename');
    const { type } = await params;

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Fetch the file from the original URL
    const response = await fetch(url);
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch file' }, { status: 404 });
    }

    // Get the content type from the original response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the file content
    const buffer = await response.arrayBuffer();

    // Set appropriate headers based on file type
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `inline; filename="${filename || 'document'}"`);
    
    // Add specific headers for different file types
    switch (type) {
      case 'pdf':
        headers.set('Content-Type', 'application/pdf');
        break;
      case 'image':
        if (contentType.startsWith('image/')) {
          headers.set('Content-Type', contentType);
        } else {
          headers.set('Content-Type', 'image/jpeg');
        }
        break;
      case 'video':
        if (contentType.startsWith('video/')) {
          headers.set('Content-Type', contentType);
        } else {
          headers.set('Content-Type', 'video/mp4');
        }
        break;
      case 'audio':
        if (contentType.startsWith('audio/')) {
          headers.set('Content-Type', contentType);
        } else {
          headers.set('Content-Type', 'audio/mpeg');
        }
        break;
    }

    // Return the file with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error('Error serving document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 