/** Common typos in education chat (scope check + school resolution). */
export function normalizeEducationChatText(text: string): string {
  return text
    .replace(/\bunivesit(y|ies)\b/gi, (_, suffix) => (suffix.toLowerCase() === "ies" ? "universities" : "university"))
    .replace(/\buniveristy\b/gi, "university")
    .replace(/\buniverity\b/gi, "university")
    .replace(/\bzimbabwae\b/gi, "zimbabwe")
    .replace(/\bzimbabw\b/gi, "zimbabwe");
}
