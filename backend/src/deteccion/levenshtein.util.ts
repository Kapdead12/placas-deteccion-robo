// Distancia de edición entre dos strings cortos (placas: ~6-7 caracteres).
// Usada para tolerar confusiones típicas de OCR (0↔O, 1↔I, 5↔S, 8↔B) al
// cruzar contra placas_reportadas, en vez de exigir un match exacto.
export function levenshtein(a: string, b: string): number {
  const filas = a.length + 1;
  const columnas = b.length + 1;
  const dp: number[][] = Array.from({ length: filas }, () => new Array<number>(columnas).fill(0));

  for (let i = 0; i < filas; i++) dp[i][0] = i;
  for (let j = 0; j < columnas; j++) dp[0][j] = j;

  for (let i = 1; i < filas; i++) {
    for (let j = 1; j < columnas; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // borrado
        dp[i][j - 1] + 1, // inserción
        dp[i - 1][j - 1] + costo, // sustitución
      );
    }
  }

  return dp[filas - 1][columnas - 1];
}
