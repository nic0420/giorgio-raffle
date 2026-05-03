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
      return NextResponse.json({ error: 'No active raffle' }, { status: 404 });
    }

    const soldTickets = raffle.tickets.filter(t => t.status === 'SOLD');
    const totalRevenue = soldTickets.length * raffle.price;

    return NextResponse.json({
      totalRevenue,
      soldCount: soldTickets.length,
      totalTickets: raffle.totalTickets,
      status: raffle.status
    });
  } catch (error) {
    console.error('Stats Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
