package drivesync.web

import java.time.Instant

import zio.json.*

import drivesync.db.DownloadedFile

final case class VideoResponse(id: String, title: String, createdTime: Instant) derives JsonEncoder

final case class CourseResponse(title: String, videos: List[VideoResponse]) derives JsonEncoder

final case class WatchResponse(
  video: VideoResponse,
  course: String,
  previous: Option[VideoResponse],
  next: Option[VideoResponse]
) derives JsonEncoder

object ApiModels {

  def video(file: DownloadedFile): VideoResponse =
    VideoResponse(file.driveId, Catalog.videoTitle(file), file.createdTime)

  def course(course: Course): CourseResponse =
    CourseResponse(Catalog.courseTitle(course.folder), course.videos.map(video))

  def watch(watch: Watch): WatchResponse =
    WatchResponse(
      video(watch.video),
      Catalog.courseTitle(watch.course.folder),
      watch.previous.map(video),
      watch.next.map(video)
    )
}
