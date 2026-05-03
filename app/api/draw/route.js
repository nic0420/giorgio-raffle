import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { winningNumber } = await request.json();

    if (!winningNumber) {
      return NextResponse.json({ error: 'Falta ingresar el número ganador' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findFirst({
      where: { status: 'ACTIVE' },
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No active raffle' }, { status: 404 });
    }

    const winningTicket = await prisma.ticket.findFirst({
      where: { 
        raffleId: raffle.id, 
        number: parseInt(winningNumber)
      },
      include: { purchase: true }
    });

    if (!winningTicket || winningTicket.status !== 'SOLD') {
      return NextResponse.json({ error: `El número ${winningNumber} no fue vendido. Sorteo vacante o revisá el número.` }, { status: 400 });
    }

    // Actualizar raffle a DRAWN y guardar el ID del ticket ganador
    await prisma.raffle.update({
      where: { id: raffle.id },
      data: { 
        status: 'DRAWN',
        winnerTicketId: winningTicket.id
      }
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
