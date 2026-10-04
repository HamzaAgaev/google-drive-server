package drivesync.sync

import java.nio.file.Path

import zio.test.*

import drivesync.sync.TestFiles.remote

object LocalPathsSpec extends ZIOSpecDefault {

  def spec = suite("LocalPaths")(
    test("builds path from folders and name") {
      val file = remote("1", "video.mp4", folders = List("root", "course"))
      val paths = LocalPaths.assign(List(file), Map.empty)
      assertTrue(paths("1") == Path.of("root", "course", "video.mp4"))
    },
    test("trims spaces and replaces unsafe segments") {
      val file = remote("1", " a/b\\c.mp4 ", folders = List("..", "course "))
      val paths = LocalPaths.assign(List(file), Map.empty)
      assertTrue(paths("1") == Path.of("_", "course", "a_b_c.mp4"))
    },
    test("adds numeric suffix for duplicate names in creation order") {
      val files = List(
        remote("late", "video.mp4", createdAt = 20),
        remote("early", "video.mp4", createdAt = 10),
        remote("latest", "video.mp4", createdAt = 30)
      )
      val paths = LocalPaths.assign(files, Map.empty)
      assertTrue(
        paths("early") == Path.of("root", "video.mp4"),
        paths("late") == Path.of("root", "video (2).mp4"),
        paths("latest") == Path.of("root", "video (3).mp4")
      )
    },
    test("keeps existing paths and avoids them for new files") {
      val existing = Map("old" -> Path.of("root", "video.mp4"))
      val files = List(remote("old", "renamed.mp4"), remote("new", "video.mp4"))
      val paths = LocalPaths.assign(files, existing)
      assertTrue(
        paths("old") == Path.of("root", "video.mp4"),
        paths("new") == Path.of("root", "video (2).mp4")
      )
    },
    test("avoids paths of files no longer in Drive") {
      val existing = Map("deleted" -> Path.of("root", "video.mp4"))
      val paths = LocalPaths.assign(List(remote("new", "video.mp4")), existing)
      assertTrue(paths("new") == Path.of("root", "video (2).mp4"))
    }
  )
}
