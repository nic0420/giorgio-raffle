import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST() {
  try {
    const raffle = await prisma.raffle.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No active raffle' }, { status: 404 });
    }

    const soldTickets = await prisma.ticket.findMany({
      where: { raffleId: raffle.id, status: 'SOLD' },
      include: { purchase: true }
    });

    if (soldTickets.length === 0) {
      return NextResponse.json({ error: 'No sold tickets to draw from' }, { status: 400 });
    }

    // Sortear
    const randomIndex = Math.floor(Math.random() * soldTickets.length);
    const winningTicket = soldTickets[randomIndex];

    // Actualizar raffle a DRAWN
    await prisma.raffle.update({
      where: { id: raffle.id },
      data: { status: 'DRAWN' }
    });

    return NextResponse.json({
      winner: {
        number: winningTicket.number,
        name: winningTicket.purchase?.customerName || 'Desconocido',
        phone: winningTicket.purchase?.customerPhone || 'Desconocido'
      }
    });

  } catch (error) {
    console.error('Draw Error:', error);
    return NextResponse.json({ error: 'Failed to perform draw' }, { status: 500 });
  }
}
