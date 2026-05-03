import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import prisma from '@/lib/prisma';

// Configura Mercado Pago (Usa tu Access Token)
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000' });

export async function POST(request) {
  try {
    const body = await request.json();
    const { selectedTickets, customer, ticketPrice } = body;

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

    const preference = new Preference(client);

    const items = selectedTickets.map(num => ({
      id: `ticket-${num}`,
      title: `Rifa Giorgio - Número ${num}`,
      quantity: 1,
      unit_price: Number(ticketPrice),
      currency_id: 'ARS',
    }));

    const response = await preference.create({
      body: {
        items,
        payer: {
          name: customer.name,
          email: customer.email,
          phone: {
            number: customer.whatsapp,
          }
        },
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}?status=success`,
          failure: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}?status=failure`,
          pending: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}?status=pending`,
        },
        auto_return: 'approved',
        external_reference: `purchase_${purchase.id}` // Identificador único atado al DB ID
      }
    });

    return NextResponse.json({ init_point: response.init_point });
  } catch (error) {
    console.error('Error creating preference:', error);
    return NextResponse.json({ error: 'Failed to create preference' }, { status: 500 });
  }
}
