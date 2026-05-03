import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const raffle = await prisma.raffle.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        tickets: true
      }
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No active raffle found' }, { status: 404 });
    }

    // Retornamos el sorteo y mapeamos los tickets a un formato más sencillo para el frontend
    const ticketsStatus = raffle.tickets.reduce((acc, ticket) => {
      acc[ticket.number] = ticket.status;
      return acc;
    }, {});

    return NextResponse.json({ 
      raffle: {
        title: raffle.title,
        price: raffle.price,
        drawDate: raffle.drawDate,
        totalTickets: raffle.totalTickets
      },
      tickets: ticketsStatus 
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch raffle data' }, { status: 500 });
  }
}
