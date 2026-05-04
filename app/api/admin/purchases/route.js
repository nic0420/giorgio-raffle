import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const purchases = await prisma.purchase.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        tickets: true
      }
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { purchaseId, action } = await request.json();

    if (!purchaseId || action !== 'APPROVE') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { tickets: true }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Actualizar compra a APPROVED
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'APPROVED' }
    });

    // Actualizar tickets a SOLD
    await prisma.ticket.updateMany({
      where: { purchaseId: purchaseId },
      data: { status: 'SOLD' }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to approve purchase' }, { status: 500 });
  }
}
