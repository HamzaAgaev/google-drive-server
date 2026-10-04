package drivesync.web

import java.nio.file.Path
import java.time.Instant

import zio.test.*

import drivesync.db.DownloadedFile

object CatalogSpec extends ZIOSpecDefault {

  private def video(id: String, path: String, createdAt: Long): DownloadedFile =
    DownloadedFile(id, Path.of(path), "md5", Instant.ofEpochSecond(createdAt))

  private val files = List(
    video("unix-1", "root/Unix/1.mp4", 10),
    video("cpp-1", "root/C++/1.mp4", 20),
    video("unix-2", "root/Unix/2.mp4", 30),
    video("unix-3", "root/Unix/3.mp4", 40)
  )

  def spec = suite("Catalog")(
    test("groups by folder, newest videos and courses first") {
      val courses = Catalog.courses(files)
      assertTrue(
        courses.map(_.folder) == List(Path.of("root/Unix"), Path.of("root/C++")),
        courses.head.videos.map(_.driveId) == List("unix-3", "unix-2", "unix-1")
      )
    },
    test("previous is the older and next is the newer video of the same course") {
      val watch = Catalog.watch(files, "unix-2")
      assertTrue(
        watch.flatMap(_.previous).map(_.driveId).contains("unix-1"),
        watch.flatMap(_.next).map(_.driveId).contains("unix-3")
      )
    },
    test("no neighbours across courses") {
      val watch = Catalog.watch(files, "cpp-1")
      assertTrue(watch.exists(w => w.previous.isEmpty && w.next.isEmpty))
    },
    test("unknown video") {
      assertTrue(Catalog.watch(files, "missing").isEmpty)
    }
  )
}
