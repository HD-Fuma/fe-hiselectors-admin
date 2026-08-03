const QR_PATTERN = [
  "111111101010101111111",
  "100000101110101000001",
  "101110100011101011101",
  "101110101110001011101",
  "101110100101101011101",
  "100000101011101000001",
  "111111101010101111111",
  "000000001101100000000",
  "101011110010111010101",
  "010110001111000101110",
  "111001111001111010001",
  "001110001110001101110",
  "101101111011101110101",
  "000000001100101000110",
  "111111101011111010111",
  "100000100110001000101",
  "101110101101101111111",
  "101110100011001001010",
  "101110101110111011101",
  "100000101001000110010",
  "111111101111101011111",
] as const;

export function QrBadge() {
  return (
    <svg
      className="partners-login__qr-image"
      role="img"
      aria-label="파트너스 앱 QR"
      viewBox="0 0 25 25"
      shapeRendering="crispEdges"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="25" height="25" fill="#ffffff" />
      {QR_PATTERN.flatMap((row, rowIndex) =>
        [...row].map((cell, columnIndex) =>
          cell === "1" ? (
            <rect
              key={`${rowIndex}-${columnIndex}`}
              x={columnIndex + 2}
              y={rowIndex + 2}
              width="1"
              height="1"
              fill="#111111"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
