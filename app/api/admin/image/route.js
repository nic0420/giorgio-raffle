import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to increase body size limit for base64 images
export const maxDuration = 10;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Get the active raffle
    const raffle = await prisma.raffle.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No active raffle found' }, { status: 404 });
    }

    // Update the raffle with the new image
    await prisma.raffle.update({
      where: { id: raffle.id },
      data: {
        images: [imageBase64]
      }
    });

    return NextResponse.json({ success: true, message: 'Image updated successfully' });
  } catch (error) {
    console.error('Update Image Error:', error);
    return NextResponse.json({ error: 'Failed to update image' }, { status: 500 });
  }
}
