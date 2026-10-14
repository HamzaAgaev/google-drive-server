import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import { api, ApiError, fileUrl } from "../api";
import { lectureTitle } from "../lectureTitle";
import { formatTimecode, parseTimecode, timecodeParam } from "../timecode";
import { useApi } from "../useApi";
import { siteTitle } from "../ui/AppShell";
import { Breadcrumbs } from "../ui/Breadcrumbs";
import { Button, ButtonLink } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { SegmentedControl } from "../ui/SegmentedControl";
import { Skeleton } from "../ui/Skeleton";
import { Cluster, Stack } from "../ui/Stack";
import { Text } from "../ui/Text";
import { VideoPlayer } from "../ui/player/VideoPlayer";

export function WatchPage() {
  const { id = "" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shareStatus, setShareStatus] = useState<string>();
  const watch = useApi((signal) => api.video(id, signal), [id]);
  const startTime = parseTimecode(searchParams.get("t"));

  useEffect(() => {
    if (watch.status === "success") {
      document.title = `${lectureTitle(watch.data.title)} · ${watch.data.course}`;
    } else {
      document.title = siteTitle;
    }
  }, [watch]);

  useEffect(() => {
    if (!shareStatus) return;
    const timeout = setTimeout(() => setShareStatus(undefined), 3000);
    return () => clearTimeout(timeout);
  }, [shareStatus]);

  if (watch.status === "loading") {
    return (
      <Stack gap={4}>
        <Skeleton height={20} width={240} />
        <Skeleton height={36} width="60%" />
        <Skeleton height={420} />
      </Stack>
    );
  }
  if (watch.status === "error") {
    const notFound = watch.error instanceof ApiError && watch.error.status === 404;
    return (
      <EmptyState
        title={notFound ? "Видео не найдено" : "Не удалось загрузить видео"}
        action={<ButtonLink to="/">Все курсы</ButtonLink>}
      />
    );
  }

  const lecture = watch.data;
  const currentTime = () => Math.floor(videoRef.current?.currentTime ?? 0);
  const watchPath = (videoId: string, time: number) =>
    `/watch/${videoId}${time > 0 ? `?t=${timecodeParam(time)}` : ""}`;

  const share = async () => {
    const time = currentTime();
    const url = new URL(watchPath(lecture.id, time), window.location.origin).toString();
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus(
        time > 0 ? `Ссылка с ${formatTimecode(time)} скопирована` : "Ссылка скопирована",
      );
    } catch {
      window.prompt("Скопируйте ссылку", url);
    }
  };

  return (
    <Stack gap={5}>
      <Stack gap={3}>
        <Breadcrumbs
          items={[
            { label: "Курсы", to: "/" },
            { label: lecture.course, to: `/courses/${lecture.courseId}` },
            { label: lectureTitle(lecture.title) },
          ]}
        />
        <h1>{lectureTitle(lecture.title)}</h1>
      </Stack>
      <Cluster justify="between" gap={3}>
        {lecture.variants.length > 1 ? (
          <SegmentedControl
            options={lecture.variants.map((variant) => ({
              value: variant.id,
              label: variant.name,
            }))}
            value={lecture.id}
            onChange={(variantId) => navigate(watchPath(variantId, currentTime()))}
          />
        ) : (
          <Text tone="muted" size="sm">
            {lecture.variant}
          </Text>
        )}
        <Cluster gap={3}>
          {shareStatus && (
            <Text tone="muted" size="sm">
              {shareStatus}
            </Text>
          )}
          <Button icon={<Link2 size={16} />} onClick={share}>
            Поделиться
          </Button>
        </Cluster>
      </Cluster>
      <VideoPlayer
        key={lecture.id}
        ref={videoRef}
        videoId={lecture.id}
        src={fileUrl(lecture.id)}
        startTime={startTime}
      />
      <Cluster justify="between">
        {lecture.previous ? (
          <ButtonLink
            to={`/watch/${lecture.previous.id}`}
            variant="ghost"
            icon={<ChevronLeft size={16} />}
          >
            {lectureTitle(lecture.previous.title)}
          </ButtonLink>
        ) : (
          <span />
        )}
        {lecture.next && (
          <ButtonLink to={`/watch/${lecture.next.id}`} variant="ghost">
            {lectureTitle(lecture.next.title)}
            <ChevronRight size={16} />
          </ButtonLink>
        )}
      </Cluster>
    </Stack>
  );
}
