import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch the most recent active or completed raffle
    const raffle = await prisma.raffle.findFirst({
      where: { 
        status: { in: ['ACTIVE', 'COMPLETED', 'DRAWN'] } 
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tickets: {
          include: { purchase: true }
        }
      }
    });

    if (!raffle) {
      return NextResponse.json({ error: 'No active raffle found' }, { status: 404 });
    }

    const ticketsStatus = raffle.tickets.reduce((acc, ticket) => {
      acc[ticket.number] = ticket.status;
      return acc;
    }, {});

    let winnerInfo = null;
    if (raffle.status === 'COMPLETED' && raffle.winnerTicketId) {
      const winnerTicket = raffle.tickets.find(t => t.id === raffle.winnerTicketId);
      if (winnerTicket && winnerTicket.purchase) {
        winnerInfo = {
          number: winnerTicket.number,
          name: winnerTicket.purchase.customerName
        };
      }
    }

    return NextResponse.json({ 
      raffle: {
        id: raffle.id,
        title: raffle.title,
        price: raffle.price,
        drawDate: raffle.drawDate,
        totalTickets: raffle.totalTickets,
        status: raffle.status
      },
      tickets: ticketsStatus,
      winner: winnerInfo
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch raffle data' }, { status: 500 });
  }
}
