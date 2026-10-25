/**
 * 알라딘 카테고리에서 중분류 추출
 * 예: "국내도서>소설/시/희곡>한국소설" → "소설/시/희곡"
 *
 * @param categoryName - 알라딘 API의 categoryName (예: "국내도서>소설/시/희곡>한국소설")
 * @returns 중분류 문자열 또는 null (카테고리가 없는 경우)
 */
export function extractMiddleCategory(
  categoryName: string | undefined | null
): string | null {
  if (!categoryName) return null;
  const parts = categoryName.split('>');
  // 중분류가 있으면 반환, 없으면 대분류, 그것도 없으면 null
  return parts[1]?.trim() || parts[0]?.trim() || null;
}

/**
 * 화면에 보여줄 장르
 * books.genre(ReadZone 장르)를 우선하고, 장르를 채우기 전의 알라딘 데이터는 중분류를 보여준다.
 */
export function getGenreLabel(
  book: { genre?: string | null; category?: string | null } | null | undefined
): string | null {
  if (!book) return null;
  return book.genre || extractMiddleCategory(book.category);
}
