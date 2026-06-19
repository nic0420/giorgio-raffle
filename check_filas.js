const filas = [
  [66, 38, 31, 49, 17],
  [1, 21, 41, 61, 81],
  [2, 22, 42, 62, 82],
  [3, 23, 43, 63, 83],
  [4, 24, 44, 64, 84],
  [5, 25, 45, 65, 85],
  [6, 26, 46, 0, 86],
  [7, 27, 47, 67, 87],
  [8, 28, 48, 68, 88],
  [9, 29, 60, 69, 89],
  [10, 30, 50, 70, 90],
  [11, 40, 51, 71, 91],
  [12, 32, 52, 72, 92],
  [13, 33, 53, 73, 93],
  [14, 34, 54, 74, 94],
  [15, 35, 55, 75, 95],
  [16, 36, 56, 76, 96],
  [80, 37, 57, 77, 97],
  [18, 20, 58, 78, 98],
  [19, 39, 59, 79, 99]
];

const allNumbers = filas.flat();
const unique = new Set(allNumbers);

console.log("Total numbers:", allNumbers.length);
console.log("Unique numbers:", unique.size);

const missing = [];
for (let i = 0; i < 100; i++) {
  if (!unique.has(i)) missing.push(i);
}
console.log("Missing:", missing);

const counts = {};
allNumbers.forEach(n => counts[n] = (counts[n] || 0) + 1);
const duplicates = Object.keys(counts).filter(n => counts[n] > 1);
console.log("Duplicates:", duplicates);
