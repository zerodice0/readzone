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
