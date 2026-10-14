package drivesync.web

import java.nio.charset.StandardCharsets.UTF_8
import java.nio.file.Path
import java.security.MessageDigest
import java.time.Instant
import java.util.HexFormat

import scala.jdk.CollectionConverters.*

import drivesync.config.VariantConfig
import drivesync.db.DownloadedFile

final case class Variant(name: String, file: DownloadedFile)

final case class Lecture(title: String, createdTime: Instant, variants: List[Variant])

final case class Course(folder: Path, lectures: List[Lecture])

final case class Watch(
  variant: Variant,
  lecture: Lecture,
  course: Course,
  previous: Option[Variant],
  next: Option[Variant]
)

final class Catalog(variants: List[VariantConfig]) {

  private val markers = variants.map(_.marker).filter(_.nonEmpty)

  def courses(files: List[DownloadedFile]): List[Course] =
    files
      .groupBy(_.path.getParent)
      .map { case (folder, courseFiles) => Course(folder, lectures(courseFiles)) }
      .toList
      .sortBy(_.lectures.head.createdTime)
      .reverse

  def watch(files: List[DownloadedFile], driveId: String): Option[Watch] =
    for {
      course <- courses(files).find(_.lectures.exists(_.variants.exists(_.file.driveId == driveId)))
      index = course.lectures.indexWhere(_.variants.exists(_.file.driveId == driveId))
      lecture = course.lectures(index)
      variant <- lecture.variants.find(_.file.driveId == driveId)
    } yield Watch(
      variant,
      lecture,
      course,
      course.lectures.lift(index + 1).map(sameVariant(_, variant.name)),
      course.lectures.lift(index - 1).map(sameVariant(_, variant.name))
    )

  private def lectures(files: List[DownloadedFile]): List[Lecture] =
    files
      .groupBy(file => recordingTitle(fileTitle(file)))
      .map { case (title, recordings) =>
        Lecture(
          title,
          recordings.map(_.createdTime).min,
          recordings.map(file => Variant(variantName(file), file)).sortBy(variantOrder)
        )
      }
      .toList
      .sortBy(_.createdTime)
      .reverse

  private def sameVariant(lecture: Lecture, name: String): Variant =
    lecture.variants.find(_.name == name).getOrElse(lecture.variants.head)

  private def variantOf(file: DownloadedFile): Option[VariantConfig] = {
    val title = fileTitle(file)
    variants
      .find(variant => variant.marker.nonEmpty && title.contains(variant.marker))
      .orElse(variants.find(_.marker.isEmpty))
  }

  private def variantName(file: DownloadedFile): String = variantOf(file).fold("")(_.name)

  private def variantOrder(variant: Variant): Int =
    variantOf(variant.file).fold(variants.size)(variants.indexOf)

  private def recordingTitle(title: String): String =
    markers.foldLeft(title)(_.replace(_, " ")).replaceAll("\\s+", " ").trim

  private def fileTitle(file: DownloadedFile): String =
    file.path.getFileName.toString.replaceFirst("\\.[^.]+$", "").trim
}

object Catalog {

  def courseId(folder: Path): String =
    HexFormat.of
      .formatHex(MessageDigest.getInstance("SHA-1").digest(folder.toString.getBytes(UTF_8)))
      .take(12)

  def courseTitle(folder: Path): String = {
    val segments = folder.iterator.asScala.map(_.toString).toList
    (if (segments.size > 1) segments.tail else segments).mkString(" / ")
  }
}
