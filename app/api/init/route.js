import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    // 1. Check if Raffle exists
    let raffle = await prisma.raffle.findFirst();
    
    if (!raffle) {
      raffle = await prisma.raffle.create({
        data: {
          title: 'Colección de Perfumes',
          description: 'El ganador podrá elegir 10 perfumes grandes de nuestra colección.',
          price: 10000,
          totalTickets: 100,
          drawDate: new Date('2026-06-01T00:00:00Z'),
          images: ['/premio.png'],
          status: 'ACTIVE'
        }
      });
      console.log('Raffle created:', raffle.id);
    }

    // 2. Check if tickets exist for this raffle
    const ticketsCount = await prisma.ticket.count({
      where: { raffleId: raffle.id }
    });

    if (ticketsCount === 0) {
      const ticketsToCreate = Array.from({ length: 100 }, (_, i) => ({
        number: i + 1,
        raffleId: raffle.id,
        status: 'AVAILABLE'
      }));

      await prisma.ticket.createMany({
        data: ticketsToCreate
      });
      console.log('100 Tickets created for Raffle:', raffle.id);
    }

    // 3. Check if Admin exists
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      await prisma.admin.create({
        data: {
          username: 'admin',
          password: 'password' // En producción esto debe estar hasheado
        }
      });
    }

    return NextResponse.json({ message: 'Database initialized successfully!' });
  } catch (error) {
    console.error('Init Error:', error);
    return NextResponse.json({ error: 'Failed to initialize database' }, { status: 500 });
  }
}
