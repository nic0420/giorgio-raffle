import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    // Defaulting to TRANSFERENCIA since Mercado Pago manual falls into this category
    const { selectedTickets, customer, ticketPrice, paymentMethod = 'TRANSFERENCIA' } = body;

    if (!selectedTickets || selectedTickets.length === 0) {
      return NextResponse.json({ error: 'No tickets selected' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findFirst({ where: { status: 'ACTIVE' } });
    if (!raffle) throw new Error('No active raffle');

    // 1. Guardar la compra en Prisma con estado PENDING
    const purchase = await prisma.purchase.create({
      data: {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.whatsapp,
        totalAmount: selectedTickets.length * ticketPrice,
        status: 'PENDING',
        paymentMethod: paymentMethod,
      }
    });

    // 2. Reservar los tickets elegidos
    await prisma.ticket.updateMany({
      where: {
        raffleId: raffle.id,
        number: { in: selectedTickets }
      },
      data: {
        status: 'RESERVED',
        purchaseId: purchase.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      purchaseId: purchase.id,
      redirect: `/?status=pending_manual&purchaseId=${purchase.id}`
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
  }
}
