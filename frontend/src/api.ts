export type Video = {
  id: string;
  title: string;
  createdTime: string;
};

export type Course = {
  title: string;
  videos: Video[];
};

export type Watch = {
  video: Video;
  course: string;
  previous?: Video;
  next?: Video;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Request failed with status ${status}`);
    this.status = status;
  }
}

async function getJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new ApiError(response.status);
  }
  return (await response.json()) as T;
}

export const api = {
  courses: (signal: AbortSignal) => getJson<Course[]>("/api/courses", signal),
  video: (id: string, signal: AbortSignal) =>
    getJson<Watch>(`/api/videos/${encodeURIComponent(id)}`, signal),
};

export const fileUrl = (id: string) => `/files/${encodeURIComponent(id)}`;
