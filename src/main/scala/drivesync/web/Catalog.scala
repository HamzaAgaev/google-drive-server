package drivesync.web

import java.nio.file.Path

import scala.jdk.CollectionConverters.*

import drivesync.db.DownloadedFile

final case class Course(folder: Path, videos: List[DownloadedFile])

final case class Watch(
  video: DownloadedFile,
  course: Course,
  previous: Option[DownloadedFile],
  next: Option[DownloadedFile]
)

object Catalog {

  def courses(files: List[DownloadedFile]): List[Course] =
    files
      .groupBy(_.path.getParent)
      .map { case (folder, videos) => Course(folder, videos.sortBy(_.createdTime).reverse) }
      .toList
      .sortBy(_.videos.head.createdTime)
      .reverse

  def watch(files: List[DownloadedFile], driveId: String): Option[Watch] =
    for {
      course <- courses(files).find(_.videos.exists(_.driveId == driveId))
      index = course.videos.indexWhere(_.driveId == driveId)
    } yield Watch(
      course.videos(index),
      course,
      course.videos.lift(index + 1),
      course.videos.lift(index - 1)
    )

  def courseTitle(folder: Path): String = folder.iterator.asScala.mkString(" / ")

  def videoTitle(video: DownloadedFile): String =
    video.path.getFileName.toString.replaceFirst("\\.[^.]+$", "").trim
}
