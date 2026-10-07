const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
