import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { winningNumber, confirmWinner } = await request.json();

    const raffle = await prisma.raffle.findFirst({
      where: { status: { in: ['ACTIVE', 'DRAWN', 'COMPLETED'] } },
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No active raffle' }, { status: 404 });
    }

    if (confirmWinner) {
      if (!raffle.winnerTicketId) {
        return NextResponse.json({ error: 'No hay ganador previo para confirmar' }, { status: 400 });
      }
      await prisma.raffle.update({
        where: { id: raffle.id },
        data: { status: 'COMPLETED' }
      });
      return NextResponse.json({ success: true });
    }

    if (!winningNumber) {
      return NextResponse.json({ error: 'Falta ingresar el número ganador' }, { status: 400 });
    }

    const winningTicket = await prisma.ticket.findFirst({
      where: { 
        raffleId: raffle.id, 
        number: parseInt(winningNumber)
      },
      include: { 
        purchase: {
          include: { tickets: true }
        }
      }
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
        phone: winningTicket.purchase?.customerPhone || 'Desconocido',
        email: winningTicket.purchase?.customerEmail || 'Desconocido',
        purchaseDate: winningTicket.purchase?.createdAt,
        totalNumbers: winningTicket.purchase?.tickets?.length || 1,
        purchaseStatus: winningTicket.purchase?.status,
        orderId: winningTicket.purchase?.id
      }
    });

  } catch (error) {
    console.error('Draw Error:', error);
    return NextResponse.json({ error: 'Failed to perform draw' }, { status: 500 });
  }
}
