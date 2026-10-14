package drivesync.web

import java.nio.file.Path
import java.time.Instant

import zio.test.*

import drivesync.config.VariantConfig
import drivesync.db.DownloadedFile

object CatalogSpec extends ZIOSpecDefault {

  private val catalog = Catalog(
    List(
      VariantConfig("(merged)", "Экран и камера"),
      VariantConfig("", "Экран"),
      VariantConfig("(as)", "Камера")
    )
  )

  private def video(id: String, path: String, createdAt: Long): DownloadedFile =
    DownloadedFile(id, Path.of(path), "md5", Instant.ofEpochSecond(createdAt))

  private val files = List(
    video("unix-1-as", "root/Unix/2026-09-07 17_31 (as) Unix.mp4", 10),
    video("unix-1-screen", "root/Unix/2026-09-07 17_31 Unix.mp4", 11),
    video("unix-1-merged", "root/Unix/(merged) 2026-09-07 17_31 Unix.mp4", 12),
    video("cpp-1", "root/C++/2026-09-08 18_25 C++.mp4", 20),
    video("unix-2-screen", "root/Unix/2026-09-14 17_33 Unix.mp4", 30),
    video("unix-3-as", "root/Unix/2026-09-21 17_36 (as) Unix.mp4", 40),
    video("unix-3-screen", "root/Unix/2026-09-21 17_36 Unix.mp4", 41)
  )

  def spec = suite("Catalog")(
    test("groups variants of one recording into a lecture in configured order") {
      val unix = catalog.courses(files).head
      val oldest = unix.lectures.last
      assertTrue(
        oldest.title == "2026-09-07 17_31 Unix",
        oldest.createdTime == Instant.ofEpochSecond(10),
        oldest.variants.map(_.name) == List("Экран и камера", "Экран", "Камера")
      )
    },
    test("courses and lectures are sorted newest first") {
      val courses = catalog.courses(files)
      assertTrue(
        courses.map(_.folder) == List(Path.of("root/Unix"), Path.of("root/C++")),
        courses.head.lectures.map(_.title) ==
          List("2026-09-21 17_36 Unix", "2026-09-14 17_33 Unix", "2026-09-07 17_31 Unix")
      )
    },
    test("neighbour lectures keep the current variant when available") {
      val watch = catalog.watch(files, "unix-3-as")
      assertTrue(
        watch.map(_.variant.name).contains("Камера"),
        watch.flatMap(_.previous).map(_.file.driveId).contains("unix-2-screen"),
        watch.flatMap(_.next).isEmpty
      )
    },
    test("previous lecture with the same variant") {
      val watch = catalog.watch(files, "unix-2-screen")
      assertTrue(
        watch.flatMap(_.previous).map(_.file.driveId).contains("unix-1-screen"),
        watch.flatMap(_.next).map(_.file.driveId).contains("unix-3-screen")
      )
    },
    test("no neighbours across courses and unknown videos") {
      assertTrue(
        catalog.watch(files, "cpp-1").exists(w => w.previous.isEmpty && w.next.isEmpty),
        catalog.watch(files, "missing").isEmpty
      )
    }
  )
}
