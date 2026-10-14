const positionKey = (videoId: string) => `position:${videoId}`;
const rateKey = "playbackRate";

function read(key: string): number | undefined {
  try {
    const value = Number(localStorage.getItem(key));
    return value > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, value: number | undefined) {
  try {
    if (value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, String(value));
  } catch {
    return;
  }
}

export const loadPosition = (videoId: string) => read(positionKey(videoId));
export const savePosition = (videoId: string, seconds: number | undefined) =>
  write(positionKey(videoId), seconds);
export const loadRate = () => read(rateKey);
export const saveRate = (rate: number) => write(rateKey, rate);
