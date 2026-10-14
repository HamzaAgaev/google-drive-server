const recordingPattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2})_(\d{2})\b.*?(\(\d+\))?$/;

const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function lectureTitle(title: string): string {
  const match = recordingPattern.exec(title);
  if (!match) return title;
  const [, year, month, day, hours, minutes, copy] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const label = `${dateFormat.format(date)}, ${hours}:${minutes}`;
  return copy ? `${label} ${copy}` : label;
}
