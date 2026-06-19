const fs = require('fs');
let content = fs.readFileSync('app/api/checkout/route.js', 'utf8');

// Replace pricing logic
content = content.replace(
  "const { selectedTickets, customer, ticketPrice, paymentMethod = 'MERCADOPAGO' } = body;",
  "const { selectedTickets, customer, paymentMethod = 'MERCADOPAGO' } = body;"
);

content = content.replace(
  "const purchase = await prisma.purchase.create({",
  `const filasCount = selectedTickets.length / 5;
    const totalAmount = Math.floor(filasCount / 2) * 3000 + (filasCount % 2) * 1800;

    // 1. Guardar la compra en Prisma con estado PENDING
    const purchase = await prisma.purchase.create({`
);

// We need a regex or exact match to replace all selectedTickets.length * ticketPrice
content = content.replace(
  "totalAmount: selectedTickets.length * ticketPrice,",
  "totalAmount: totalAmount,"
);

content = content.replace(
  "Total a pagar:</strong> $${selectedTickets.length * ticketPrice}",
  "Total a pagar:</strong> $${totalAmount}"
);

content = content.replace(
  "total=${selectedTickets.length * ticketPrice}",
  "total=${totalAmount}"
);

content = content.replace(
  "unit_price: Number(ticketPrice) * selectedTickets.length,",
  "unit_price: totalAmount,"
);

// Also replace WhatsApp number
content = content.replace(
  "wa.me/5493794180451",
  "wa.me/543794662479"
);

fs.writeFileSync('app/api/checkout/route.js', content);
console.log('Done replacing api/checkout/route.js');
