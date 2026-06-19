const fs = require('fs');
let content = fs.readFileSync('app/page.js', 'utf8');

// Replace state
content = content.replace(
  "const [selectedTickets, setSelectedTickets] = useState([]);",
  `const FILAS = [
    [66, 38, 31, 49, 17], [1, 21, 41, 61, 81], [2, 22, 42, 62, 82], [3, 23, 43, 63, 83], [4, 24, 44, 64, 84],
    [5, 25, 45, 65, 85], [6, 26, 46, 0, 86], [7, 27, 47, 67, 87], [8, 28, 48, 68, 88], [9, 29, 60, 69, 89],
    [10, 30, 50, 70, 90], [11, 40, 51, 71, 91], [12, 32, 52, 72, 92], [13, 33, 53, 73, 93], [14, 34, 54, 74, 94],
    [15, 35, 55, 75, 95], [16, 36, 56, 76, 96], [80, 37, 57, 77, 97], [18, 20, 58, 78, 98], [19, 39, 59, 79, 99]
  ];
  const [selectedFilas, setSelectedFilas] = useState([]);
  const selectedTickets = selectedFilas.flatMap(i => FILAS[i]);`
);

// Replace counts and Fila pricing
content = content.replace(
  "const ticketPrice = raffleInfo.price;\n  const totalTickets = raffleInfo.totalTickets;\n  const soldCount = Object.values(ticketsStatus).filter(s => s === 'SOLD').length;",
  `const ticketPrice = 1800; // Unused for Fila
  const totalFilas = FILAS.length;
  const soldFilasCount = FILAS.filter(fila => fila.some(num => ticketsStatus[num] === 'SOLD')).length;
  const totalTickets = raffleInfo.totalTickets;`
);

content = content.replace("soldCount} / {totalTickets", "soldFilasCount} / {totalFilas");
content = content.replace("(soldCount/totalTickets)*100", "(soldFilasCount/totalFilas)*100");
content = content.replace("ELEGÍ TUS NÚMEROS", "ELEGÍ TUS FILAS");
content = content.replace("Seleccioná tus números favoritos del 1 al {totalTickets}", "Seleccioná tus filas favoritas (cada fila incluye 5 números)");

content = content.replace(
  "const handleTicketClick = (num) => {",
  `const handleFilaClick = (filaIndex) => {
    if (!isRaffleActive) return;
    const filaNumbers = FILAS[filaIndex];
    const isSoldOrReserved = filaNumbers.some(num => ticketsStatus[num] === 'SOLD' || ticketsStatus[num] === 'RESERVED');
    if (isSoldOrReserved) return;
    
    if (selectedFilas.includes(filaIndex)) {
      setSelectedFilas(selectedFilas.filter(f => f !== filaIndex));
    } else {
      if (selectedFilas.length >= 5) {
        alert("Podés comprar hasta 5 filas por persona.");
        return;
      }
      setSelectedFilas([...selectedFilas, filaIndex].sort((a,b) => a - b));
    }
  };

  const _unused_handleTicketClick = (num) => {`
);

content = content.replace(
  "const totalAmount = selectedTickets.length * ticketPrice;",
  "const filasCount = selectedFilas.length;\n  const totalAmount = Math.floor(filasCount / 2) * 3000 + (filasCount % 2) * 1800;"
);

content = content.replace(
  `{Array.from({ length: totalTickets }, (_, i) => i + 1).map((num) => {
                const status = ticketsStatus[num];
                const isSoldOrReserved = status === 'SOLD' || status === 'RESERVED';
                const isSelected = selectedTickets.includes(num);
                return (
                  <button
                    key={num}
                    className={\`\${styles.ticket} \${isSelected ? styles.selected : ''}\`}
                    disabled={isSoldOrReserved || isFetching || !isRaffleActive}
                    onClick={() => handleTicketClick(num)}
                  >
                    {num}
                  </button>
                );
              })}`,
  `{FILAS.map((filaNumbers, index) => {
                const isSoldOrReserved = filaNumbers.some(num => ticketsStatus[num] === 'SOLD' || ticketsStatus[num] === 'RESERVED');
                const isSelected = selectedFilas.includes(index);
                return (
                  <button
                    key={index}
                    className={\`\${styles.ticket} \${isSelected ? styles.selected : ''}\`}
                    style={{ width: '100%', padding: '1rem', aspectRatio: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', gridColumn: 'span 10' }}
                    disabled={isSoldOrReserved || isFetching || !isRaffleActive}
                    onClick={() => handleFilaClick(index)}
                  >
                    <strong>Fila {index + 1}</strong>
                    <span style={{letterSpacing: '2px', fontWeight: 'bold'}}>{filaNumbers.map(n => n.toString().padStart(2, '0')).join('-')}</span>
                  </button>
                );
              })}`
);

content = content.replace(
  "👥 <strong>Podés comprar hasta 5 números por persona.</strong>",
  "👥 <strong>Podés comprar hasta 5 filas por persona.</strong>"
);

content = content.replace(
  "TUS NÚMEROS SELECCIONADOS ({selectedTickets.length})",
  "TUS FILAS SELECCIONADAS ({selectedFilas.length})"
);

content = content.replace(
  "{selectedTickets.map(num => <span key={num} className={styles.bubble}>{num}</span>)}",
  "{selectedFilas.map(idx => <span key={idx} className={styles.bubble}>{idx + 1}</span>)}"
);

content = content.replace(
  "(${ticketPrice.toLocaleString('es-AR')} c/u)",
  ""
);

content = content.replace(
  "<span>Precio por número</span>\n              <span>${ticketPrice.toLocaleString('es-AR')}</span>",
  "<span>Precio por Fila</span>\n              <span>$1.800 (Promo 2 x $3.000)</span>"
);

content = content.replace(
  "<span>Números seleccionados</span>\n              <span>{selectedTickets.length}</span>",
  "<span>Filas seleccionadas</span>\n              <span>{selectedFilas.length}</span>"
);

content = content.replace(
  "Elegís tus números del 1 al {totalTickets}.",
  "Elegís tus filas favoritas."
);

content = content.replace(
  "Solo {totalTickets} números disponibles.",
  "Solo {totalFilas} filas disponibles."
);

// We need to keep the whatsapp link variables using urlTickets or selectedFilas
content = content.replace(
  "urlTickets || selectedTickets.join(', ')",
  "urlTickets || 'Filas ' + selectedFilas.map(i => i+1).join(', ')"
);

content = content.replace(
  "HASTA 5 NÚMEROS<br/>POR PERSONA",
  "HASTA 5 FILAS<br/>POR PERSONA"
);

fs.writeFileSync('app/page.js', content);
console.log('Done replacing page.js');
