// Nguồn: Animate UI (https://github.com/imskyleen/animate-ui) — registry v1,
// sao chép theo cơ chế registry kiểu shadcn (file thuộc về codebase của dự án sau khi cài).
// License: MIT + Commons Clause (dùng trong ứng dụng/website, không bán/phân phối lại component).
// Tiện ích gộp className tối thiểu (thay cho @workspace/ui/lib/utils của monorepo gốc).
export function cn(...inputs: Array<string | false | null | undefined>): string {
  return inputs.filter(Boolean).join(' ');
}
