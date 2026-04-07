/**
 * Renders AI-generated text with **bold** markdown normalized.
 * Use for chat messages and AI advice in recommendations.
 */

interface AiTextProps {
  text: string;
  className?: string;
  as?: "p" | "span" | "div";
}

function normalizeAiText(s: string): string {
  return s
    .trim()
    .replace(/\n{3,}/g, "\n\n")  // max 2 consecutive newlines
    .replace(/[ \t]+/g, " ");    // collapse spaces
}

export function AiText({ text, className = "", as: Tag = "span" }: AiTextProps) {
  const normalized = normalizeAiText(text || "");
  if (!normalized) return null;

  // Split by **...** and render bold parts
  const parts = normalized.split(/(\*\*[^*]+\*\*)/g);
  const children = parts.map((part: string, i: number) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  return <Tag className={className}>{children}</Tag>;
}
