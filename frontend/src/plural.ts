const rules = new Intl.PluralRules("ru-RU");

export function plural(count: number, forms: { one: string; few: string; many: string }): string {
  const category = rules.select(count);
  const form = category === "one" ? forms.one : category === "few" ? forms.few : forms.many;
  return `${count} ${form}`;
}

export const lecturesCount = (count: number) =>
  plural(count, { one: "лекция", few: "лекции", many: "лекций" });
