export function generateQRCodeSvg(url: string, size = 110): string {
  const n = 25;
  const grid: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const isFunction: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));

  const setFinder = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const row = r + i;
        const col = c + j;
        if (row >= 0 && row < n && col >= 0 && col < n) {
          isFunction[row][col] = true;
          if (i >= 0 && i <= 6 && j >= 0 && j <= 6) {
            grid[row][col] = i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4);
          } else {
            grid[row][col] = false;
          }
        }
      }
    }
  };

  setFinder(0, 0);
  setFinder(0, n - 7);
  setFinder(n - 7, 0);

  for (let i = 8; i < n - 8; i++) {
    isFunction[6][i] = true;
    grid[6][i] = i % 2 === 0;
    isFunction[i][6] = true;
    grid[i][6] = i % 2 === 0;
  }

  isFunction[n - 8][8] = true;
  grid[n - 8][8] = true;

  let hash = 2166136261;
  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  const bytes: number[] = [];
  for (let i = 0; i < url.length; i++) {
    bytes.push(url.charCodeAt(i));
  }
  while (bytes.length < 32) {
    hash = Math.imul(hash ^ (bytes.length * 31), 16777619);
    bytes.push(Math.abs(hash) & 0xff);
  }

  let byteIdx = 0;
  let bitIdx = 7;
  for (let right = n - 1; right > 0; right -= 2) {
    if (right === 6) right--;
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const y = vert;
        if (!isFunction[y][x]) {
          const bit = (bytes[byteIdx % bytes.length] >> bitIdx) & 1;
          const mask = (x + y) % 2 === 0;
          grid[y][x] = (bit === 1) !== mask;
          bitIdx--;
          if (bitIdx < 0) {
            bitIdx = 7;
            byteIdx++;
          }
        }
      }
    }
  }

  const cellSize = (size / n).toFixed(2);
  let rects = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c]) {
        rects += `<rect x="${(c * Number(cellSize)).toFixed(2)}" y="${(r * Number(cellSize)).toFixed(2)}" width="${cellSize}" height="${cellSize}" fill="#111827"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#ffffff"/>
    ${rects}
  </svg>`;
}
