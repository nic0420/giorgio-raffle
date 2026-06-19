import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Configura Mercado Pago
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-0000' });
const payment = new Payment(client);

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || url.searchParams.get('data.id');
    const type = url.searchParams.get('type');

    if (type === 'payment' && id) {
      // 1. Obtener detalles del pago desde Mercado Pago
      const paymentInfo = await payment.get({ id });

      if (paymentInfo.status === 'approved') {
        const externalReference = paymentInfo.external_reference; // purchase_ID
        
        if (externalReference && externalReference.startsWith('purchase_')) {
          const purchaseId = parseInt(externalReference.split('_')[1], 10);
          
          // Actualizar compra
          await prisma.purchase.update({
            where: { id: purchaseId },
            data: { 
              status: 'APPROVED',
              mpPaymentId: id.toString()
            }
          });

          // Actualizar tickets a vendidos
          await prisma.ticket.updateMany({
            where: { purchaseId: purchaseId },
            data: { status: 'SOLD' }
          });
          // Obtener los tickets asociados y la rifa para el correo
          const tickets = await prisma.ticket.findMany({ where: { purchaseId: purchaseId } });
          const purchaseInfo = await prisma.purchase.findUnique({ where: { id: purchaseId } });
          const raffleInfo = await prisma.raffle.findUnique({ where: { id: tickets[0].raffleId } });
          
          console.log('Pago aprobado y guardado! Compra ID:', purchaseId);
          
          // Enviar correo de confirmación de pago
          if (process.env.EMAIL_USER && process.env.EMAIL_PASS && purchaseInfo && raffleInfo) {
            try {
              await transporter.sendMail({
                from: `"Sorteos NBG" <${process.env.EMAIL_USER}>`,
                to: purchaseInfo.customerEmail,
                subject: `Pago Aprobado - ${raffleInfo.title}`,
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #25D366;">¡Pago Confirmado, ${purchaseInfo.customerName}! 🎉</h2>
                    <p>Tu pago por los números del sorteo <strong>${raffleInfo.title}</strong> ha sido aprobado con éxito.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 16px;"><strong>Tus Números Confirmados:</strong> <span style="color: #25D366; font-size: 18px; font-weight: bold;">${tickets.map(t => t.number).join(', ')}</span></p>
                    </div>
                    <p>¡Ya estás participando oficialmente! Te deseamos muchísima suerte.</p>
                  </div>
                `
              });
            } catch (emailError) {
              console.error('Error al enviar el correo de confirmación:', emailError);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
