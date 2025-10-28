const normalize = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const generateFileId = (title: string) => {
  const base = normalize(title);
  const shortBase = base.length > 48 ? base.slice(0, 48) : base;
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${shortBase || "file"}-${suffix}`;
};
