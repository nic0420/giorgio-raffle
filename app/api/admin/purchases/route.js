import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const activeRaffle = await prisma.raffle.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeRaffle) {
      return NextResponse.json({ purchases: [] });
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        tickets: {
          some: {
            raffleId: activeRaffle.id
          }
        }
      },
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

export async function DELETE(request) {
  try {
    const { purchaseId } = await request.json();

    if (!purchaseId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // 1. Liberar los tickets asociados (volver a AVAILABLE y quitar purchaseId)
    await prisma.ticket.updateMany({
      where: { purchaseId: purchaseId },
      data: { status: 'AVAILABLE', purchaseId: null }
    });

    // 2. Eliminar la compra (opcional, pero como liberamos tickets es mejor borrarla para no dejar registros huérfanos sin sentido, 
    // o podríamos marcarla como REJECTED. Como el usuario pidió eliminar, la borramos).
    await prisma.purchase.delete({
      where: { id: purchaseId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 });
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
