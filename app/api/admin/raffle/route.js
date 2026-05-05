import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const raffle = await prisma.raffle.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ raffle });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch raffle' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, description, price, totalTickets, drawDate } = body;

    // 1. Marcar los sorteos anteriores como CLOSED
    await prisma.raffle.updateMany({
      where: { status: 'ACTIVE' },
      data: { status: 'CLOSED' }
    });

    // 2. Crear nuevo sorteo
    const newRaffle = await prisma.raffle.create({
      data: {
        title: title || 'Nuevo Sorteo',
        description: description || '',
        price: parseFloat(price) || 1000,
        totalTickets: parseInt(totalTickets) || 100,
        drawDate: drawDate ? new Date(drawDate) : null,
        status: 'ACTIVE',
        images: body.imageUrl ? [body.imageUrl] : []
      }
    });

    // 3. Generar tickets para el nuevo sorteo
    const ticketsToCreate = Array.from({ length: newRaffle.totalTickets }, (_, i) => ({
      number: i + 1,
      raffleId: newRaffle.id,
      status: 'AVAILABLE'
    }));

    await prisma.ticket.createMany({
      data: ticketsToCreate
    });

    return NextResponse.json({ success: true, raffle: newRaffle });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create raffle' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, description, price, drawDate } = body;

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const updatedRaffle = await prisma.raffle.update({
      where: { id: parseInt(id) },
      data: {
        title: title,
        description: description,
        price: parseFloat(price),
        drawDate: drawDate ? new Date(drawDate) : null,
        ...(body.imageUrl !== undefined && { images: body.imageUrl ? [body.imageUrl] : [] })
      }
    });

    return NextResponse.json({ success: true, raffle: updatedRaffle });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to update raffle' }, { status: 500 });
  }
}
