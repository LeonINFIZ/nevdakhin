/**
 * Transliterates Russian text to URL-friendly Latin slug.
 * Example: "Консервы и тушенка" -> "konservy-i-tushenka"
 */
export function transliterateToSlug(text: string): string {
  if (!text) return '';

  const ruMap: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
  };

  const transliterated = text
    .toLowerCase()
    .trim()
    .split('')
    .map((char) => (ruMap[char] !== undefined ? ruMap[char] : char))
    .join('');

  return transliterated
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
