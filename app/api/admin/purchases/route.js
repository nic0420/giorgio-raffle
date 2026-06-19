import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function GET() {
  try {
    const activeRaffle = await prisma.raffle.findFirst({
      where: { status: 'ACTIVE' }
    });

    if (!activeRaffle) {
      return NextResponse.json({ purchases: [] });
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        tickets: {
          some: {
            raffleId: activeRaffle.id
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        tickets: true
      }
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { purchaseId } = await request.json();

    if (!purchaseId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // 1. Liberar los tickets asociados (volver a AVAILABLE y quitar purchaseId)
    await prisma.ticket.updateMany({
      where: { purchaseId: purchaseId },
      data: { status: 'AVAILABLE', purchaseId: null }
    });

    // 2. Eliminar la compra (opcional, pero como liberamos tickets es mejor borrarla para no dejar registros huérfanos sin sentido, 
    // o podríamos marcarla como REJECTED. Como el usuario pidió eliminar, la borramos).
    await prisma.purchase.delete({
      where: { id: purchaseId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to delete purchase' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { purchaseId, action } = await request.json();

    if (!purchaseId || action !== 'APPROVE') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { tickets: true }
    });

    if (!purchase) {
      return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
    }

    // Actualizar compra a APPROVED
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: { status: 'APPROVED' }
    });

    // Actualizar tickets a SOLD
    await prisma.ticket.updateMany({
      where: { purchaseId: purchaseId },
      data: { status: 'SOLD' }
    });

    const raffleInfo = await prisma.raffle.findUnique({ where: { id: purchase.tickets[0].raffleId } });

    // Enviar correo de confirmación de pago
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && raffleInfo) {
      try {
        await transporter.sendMail({
          from: `"Sorteos NBG" <${process.env.EMAIL_USER}>`,
          to: purchase.customerEmail,
          subject: `Pago Aprobado - ${raffleInfo.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #25D366;">¡Pago Confirmado, ${purchase.customerName}! 🎉</h2>
              <p>Tu pago por los números del sorteo <strong>${raffleInfo.title}</strong> ha sido aprobado con éxito.</p>
              <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;"><strong>Tus Números Confirmados:</strong> <span style="color: #25D366; font-size: 18px; font-weight: bold;">${purchase.tickets.map(t => t.number).join(', ')}</span></p>
              </div>
              <p>¡Ya estás participando oficialmente! Te deseamos muchísima suerte.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Error al enviar el correo de confirmación:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to approve purchase' }, { status: 500 });
  }
}
