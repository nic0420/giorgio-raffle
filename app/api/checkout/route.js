import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Configura Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000' });

export async function POST(request) {
  try {
    const body = await request.json();
    const { selectedTickets, customer, ticketPrice, paymentMethod = 'MERCADOPAGO' } = body;

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
        paymentMethod: 'MERCADOPAGO',
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

    // 3. Crear Preferencia de Mercado Pago
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const preference = new Preference(client);
    
    const mpResponse = await preference.create({
      body: {
        items: [
          {
            id: `rifa_${raffle.id}`,
            title: `Rifa Perfumería Giorgio - ${selectedTickets.length} Números`,
            quantity: 1,
            unit_price: selectedTickets.length * ticketPrice,
            currency_id: 'ARS',
          }
        ],
        payer: {
          name: customer.name,
          email: customer.email,
        },
        back_urls: {
          success: `${baseUrl}/?status=success`,
          failure: `${baseUrl}/?status=failure`,
          pending: `${baseUrl}/?status=pending`,
        },
        auto_return: 'approved',
        external_reference: `purchase_${purchase.id}`,
      }
    });

    return NextResponse.json({ 
      success: true, 
      purchaseId: purchase.id,
      redirect: mpResponse.init_point
    });

  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Failed to process checkout' }, { status: 500 });
  }
}
