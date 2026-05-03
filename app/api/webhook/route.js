import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import prisma from '@/lib/prisma';

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
          
          console.log('Pago aprobado y guardado! Compra ID:', purchaseId);
          // Aquí se integraría Resend para enviar email
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
