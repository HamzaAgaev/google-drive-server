package drivesync.web

import java.time.Instant

import zio.json.*

final case class VariantResponse(id: String, name: String) derives JsonEncoder

final case class LectureResponse(
  title: String,
  createdTime: Instant,
  variants: List[VariantResponse]
) derives JsonEncoder

final case class CourseResponse(title: String, lectures: List[LectureResponse]) derives JsonEncoder

final case class LectureLinkResponse(id: String, title: String) derives JsonEncoder

final case class WatchResponse(
  id: String,
  title: String,
  variant: String,
  course: String,
  createdTime: Instant,
  variants: List[VariantResponse],
  previous: Option[LectureLinkResponse],
  next: Option[LectureLinkResponse]
) derives JsonEncoder

object ApiModels {

  def course(course: Course): CourseResponse =
    CourseResponse(Catalog.courseTitle(course.folder), course.lectures.map(lecture))

  def watch(watch: Watch): WatchResponse =
    WatchResponse(
      watch.variant.file.driveId,
      watch.lecture.title,
      watch.variant.name,
      Catalog.courseTitle(watch.course.folder),
      watch.lecture.createdTime,
      watch.lecture.variants.map(variant),
      watch.previous.map(link(watch.course)),
      watch.next.map(link(watch.course))
    )

  private def lecture(lecture: Lecture): LectureResponse =
    LectureResponse(lecture.title, lecture.createdTime, lecture.variants.map(variant))

  private def variant(variant: Variant): VariantResponse =
    VariantResponse(variant.file.driveId, variant.name)

  private def link(course: Course)(variant: Variant): LectureLinkResponse = {
    val title = course.lectures.find(_.variants.contains(variant)).fold("")(_.title)
    LectureLinkResponse(variant.file.driveId, title)
  }
}
