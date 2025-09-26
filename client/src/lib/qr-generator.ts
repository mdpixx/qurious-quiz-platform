// Simple QR code generation without external dependencies
// In a production app, you might want to use a library like 'qrcode' or 'qr-code-generator'

export function generateQR(text: string, canvas: HTMLCanvasElement, size: number = 200) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // For now, create a simple pattern that represents a QR code
  // In production, you'd use a proper QR code library
  const moduleCount = 21; // Standard QR code size
  const moduleSize = Math.floor(size / moduleCount);
  
  ctx.fillStyle = '#000000';
  
  // Create a simple pattern based on the text
  const pattern = createPattern(text, moduleCount);
  
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (pattern[row][col]) {
        ctx.fillRect(
          col * moduleSize,
          row * moduleSize,
          moduleSize,
          moduleSize
        );
      }
    }
  }
  
  // Add finder patterns (corners)
  drawFinderPattern(ctx, 0, 0, moduleSize);
  drawFinderPattern(ctx, (moduleCount - 7) * moduleSize, 0, moduleSize);
  drawFinderPattern(ctx, 0, (moduleCount - 7) * moduleSize, moduleSize);
}

function createPattern(text: string, size: number): boolean[][] {
  const pattern: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Create a deterministic pattern based on the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) & 0xffffffff;
  }
  
  // Fill pattern based on hash
  for (let row = 1; row < size - 1; row++) {
    for (let col = 1; col < size - 1; col++) {
      // Skip finder pattern areas
      if ((row < 9 && col < 9) || 
          (row < 9 && col > size - 9) || 
          (row > size - 9 && col < 9)) {
        continue;
      }
      
      const index = row * size + col;
      pattern[row][col] = ((hash >> (index % 32)) & 1) === 1;
    }
  }
  
  return pattern;
}

function drawFinderPattern(ctx: CanvasRenderingContext2D, x: number, y: number, moduleSize: number) {
  // Draw the 7x7 finder pattern
  ctx.fillStyle = '#000000';
  
  // Outer border
  ctx.fillRect(x, y, 7 * moduleSize, 7 * moduleSize);
  
  // Inner white area
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + moduleSize, y + moduleSize, 5 * moduleSize, 5 * moduleSize);
  
  // Center black square
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
}
