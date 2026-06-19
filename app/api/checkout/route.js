import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
export async function POST(request) {
  try {
    const body = await request.json();
    const { selectedTickets, customer, paymentMethod = 'MERCADOPAGO' } = body;

    if (!selectedTickets || selectedTickets.length === 0) {
      return NextResponse.json({ error: 'No tickets selected' }, { status: 400 });
    }

    const raffle = await prisma.raffle.findFirst({ where: { status: 'ACTIVE' } });
    if (!raffle) throw new Error('No active raffle');

    // 1. Guardar la compra en Prisma con estado PENDING
    const filasCount = selectedTickets.length / 5;
    const totalAmount = Math.floor(filasCount / 2) * 3000 + (filasCount % 2) * 1800;

    // 1. Guardar la compra en Prisma con estado PENDING
    const purchase = await prisma.purchase.create({
      data: {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.whatsapp,
        totalAmount: totalAmount,
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

    // 2.5 Enviar correo de notificación
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await transporter.sendMail({
          from: `"Sorteos NBG" <${process.env.EMAIL_USER}>`,
          to: customer.email,
          subject: `Tus números para el sorteo - ${raffle.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333;">¡Hola ${customer.name}!</h2>
              <p>Tus números para el sorteo <strong>${raffle.title}</strong> han sido registrados con éxito.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>Tus Números:</strong> <span style="color: #d4af37; font-size: 18px; font-weight: bold;">${selectedTickets.join(', ')}</span></p>
                <p style="margin: 10px 0 0 0;"><strong>Total a pagar:</strong> ${totalAmount}</p>
              </div>
              <p>Si elegiste <strong>Mercado Pago</strong>, recordá que tu compra se confirma automáticamente al pagar.</p>
              <p>Si elegiste <strong>Transferencia</strong>, por favor enviá tu comprobante a nuestro WhatsApp haciendo clic aquí: <br/><a href="https://wa.me/543794662479?text=Hola! Reservé los números ${selectedTickets.join(', ')} en la rifa. Acá te mando el comprobante de transferencia." style="display: inline-block; margin-top: 10px; padding: 10px 15px; background-color: #25D366; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Enviar comprobante por WhatsApp</a>.</p>
              <br/>
              <p>¡Gracias por participar y mucha suerte!</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Error al enviar el correo:', emailError);
      }
    } else {
      console.warn('Las variables EMAIL_USER y EMAIL_PASS no están configuradas en .env. El correo no fue enviado.');
    }

    // 3. Crear Preferencia de Mercado Pago (o saltar si es transferencia)
    if (paymentMethod === 'TRANSFER') {
      return NextResponse.json({
        success: true,
        purchaseId: purchase.id,
        redirect: `/?status=pending_manual&total=${totalAmount}&tickets=${selectedTickets.join(',')}`
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
            unit_price: totalAmount,
            currency_id: 'ARS',
          }
        ],
        payer: {
          name: customer.name,
          email: customer.email,
        },
        back_urls: {
          success: `${origin}/?status=success&tickets=${selectedTickets.join(',')}`,
          failure: `${origin}/?status=failure`,
          pending: `${origin}/?status=pending&tickets=${selectedTickets.join(',')}`,
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
