/** Minúsculas y sin tildes, para que "extraccion" encuentre "extracción". */
export function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

/** Todas las palabras de la consulta deben aparecer en el texto indexado. */
export function matches(searchText: string, query: string): boolean {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  return tokens.every((token) => searchText.includes(token));
}
