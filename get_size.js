const fs = require('fs');
const buf = fs.readFileSync('public/premio.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log(`Width: ${width}, Height: ${height}`);
