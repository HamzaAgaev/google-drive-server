const units = { h: 3600, m: 60, s: 1 } as const;

export function parseTimecode(value: string | null): number | undefined {
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value) || undefined;
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
  if (!match || match[0] === "") return undefined;
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return Number(hours) * units.h + Number(minutes) * units.m + Number(seconds) || undefined;
}

export function timecodeParam(totalSeconds: number): string {
  const { hours, minutes, seconds } = split(totalSeconds);
  const parts = [hours && `${hours}h`, minutes && `${minutes}m`, seconds && `${seconds}s`];
  return parts.filter(Boolean).join("") || "0s";
}

export function formatTimecode(totalSeconds: number): string {
  const { hours, minutes, seconds } = split(totalSeconds);
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

function split(totalSeconds: number) {
  const whole = Math.max(0, Math.floor(totalSeconds));
  return {
    hours: Math.floor(whole / units.h),
    minutes: Math.floor((whole % units.h) / units.m),
    seconds: whole % units.m,
  };
}
