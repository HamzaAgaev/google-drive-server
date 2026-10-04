package drivesync.sync

import zio.test.*

import drivesync.sync.TestFiles.remote

object VariantSelectorSpec extends ZIOSpecDefault {

  private val priority = List("(merged)", "", "(as)")

  private def selectedIds(files: drivesync.google.RemoteFile*): List[String] =
    VariantSelector.select(files.toList, priority).map(_.id)

  def spec = suite("VariantSelector")(
    test("picks merged when all variants exist") {
      val ids = selectedIds(
        remote("merged", "(merged) 2026-09-29 18_27 C++.mp4"),
        remote("plain", "2026-09-29 18_27 C++.mp4"),
        remote("as", "2026-09-29 18_27 (as) C++.mp4")
      )
      assertTrue(ids == List("merged"))
    },
    test("falls back to variant without marker, then to (as)") {
      val ids = selectedIds(
        remote("plain", "2026-09-29 18_27 C++.mp4"),
        remote("as", "2026-09-29 18_27 (as) C++.mp4"),
        remote("only-as", "2026-10-04 13_58 (as) Unix.mp4")
      )
      assertTrue(ids == List("plain", "only-as"))
    },
    test("keeps all files of the best variant with the same name") {
      val ids = selectedIds(
        remote("as-1", "2026-10-01 18_27 (as) SE.mp4"),
        remote("as-2", "2026-10-01 18_27 (as) SE.mp4")
      )
      assertTrue(ids == List("as-1", "as-2"))
    },
    test("treats same names in different folders as different recordings") {
      val ids = selectedIds(
        remote("a", "(merged) lecture.mp4", folders = List("root", "a")),
        remote("b", "lecture.mp4", folders = List("root", "b"))
      )
      assertTrue(ids == List("a", "b"))
    },
    test("drops variants missing from priority") {
      val files = List(remote("plain", "lecture.mp4"), remote("as", "(as) lecture.mp4"))
      val ids = VariantSelector.select(files, List("(as)")).map(_.id)
      assertTrue(ids == List("as"))
    },
    test("empty priority keeps everything") {
      val files = List(remote("merged", "(merged) lecture.mp4"), remote("plain", "lecture.mp4"))
      assertTrue(VariantSelector.select(files, Nil) == files)
    }
  )
}
