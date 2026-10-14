export type Variant = {
  id: string;
  name: string;
};

export type Lecture = {
  title: string;
  createdTime: string;
  variants: Variant[];
};

export type Course = {
  id: string;
  title: string;
  lectures: Lecture[];
};

export type LectureLink = {
  id: string;
  title: string;
};

export type Watch = {
  id: string;
  title: string;
  variant: string;
  courseId: string;
  course: string;
  createdTime: string;
  variants: Variant[];
  previous?: LectureLink;
  next?: LectureLink;
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
