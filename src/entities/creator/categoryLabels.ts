export const CREATOR_CATEGORY_OPTIONS = [
  { label: "전체", value: "" },
  { label: "뷰티", value: "BEAUTY" },
  { label: "패션", value: "FASHION" },
  { label: "푸드", value: "FOOD" },
  { label: "리빙/라이프", value: "LIVING_LIFE" },
  { label: "유아동/패밀리", value: "KIDS_FAMILY" },
  { label: "컬처/서비스", value: "CULTURE_SERVICE" },
  { label: "스포츠/레저", value: "SPORTS_LEISURE" },
  { label: "여행", value: "TRAVEL" },
  { label: "반려생활", value: "PET_LIFE" },
] as const;

export function categoryLabel(
  code: string | null,
  extraOptions: readonly { label: string; value: string }[] = [],
) {
  if (code === null) return null;
  const options = [...extraOptions, ...CREATOR_CATEGORY_OPTIONS];
  return options.find((option) => option.value === code)?.label ?? code;
}
