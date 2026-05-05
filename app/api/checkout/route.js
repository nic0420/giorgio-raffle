import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';

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

    // 3. Crear Preferencia de Mercado Pago (o saltar si es transferencia)
    if (paymentMethod === 'TRANSFER') {
      return NextResponse.json({
        success: true,
        purchaseId: purchase.id,
        redirect: `/?status=pending_manual&total=${selectedTickets.length * ticketPrice}`
      });
    }

    const token = process.env.MP_ACCESS_TOKEN;
    if (!token || token.includes('TEST-0000')) {
      return NextResponse.json({ 
        error: 'El sistema no tiene un token de Mercado Pago configurado correctamente. Por favor, agregá tu MP_ACCESS_TOKEN real en el archivo .env' 
      }, { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const origin = new URL(request.url).origin;
    const preference = new Preference(client);
    
    const mpResponse = await preference.create({
      body: {
        items: [
          {
            id: `rifa_${raffle.id}`,
            title: `${raffle.title} - ${selectedTickets.length} Números`,
            quantity: 1,
            unit_price: Number(ticketPrice) * selectedTickets.length,
            currency_id: 'ARS',
          }
        ],
        payer: {
          name: customer.name,
          email: customer.email,
        },
        back_urls: {
          success: `${origin}/?status=success`,
          failure: `${origin}/?status=failure`,
          pending: `${origin}/?status=pending`,
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
    // Mercado Pago throws an error object with a response property usually
    const mpErrorDetails = error.response ? JSON.stringify(error.response) : error.message;
    return NextResponse.json({ error: `Hubo un problema al procesar el pago con Mercado Pago. Verificá que el Access Token sea válido. Detalles: ${mpErrorDetails}` }, { status: 500 });
  }
}
