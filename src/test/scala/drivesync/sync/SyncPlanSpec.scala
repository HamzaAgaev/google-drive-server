package drivesync.sync

import java.nio.file.Path
import java.time.Instant

import zio.test.*

import drivesync.db.DownloadedFile
import drivesync.sync.TestFiles.remote

object SyncPlanSpec extends ZIOSpecDefault {

  private def local(id: String, path: String, md5: String): DownloadedFile =
    DownloadedFile(id, Path.of(path), md5, Instant.EPOCH)

  def spec = suite("SyncPlan")(
    test("downloads new files") {
      val file = remote("1", "video.mp4")
      val plan = SyncPlan.make(List(file), Nil, Set.empty)
      assertTrue(plan == List(SyncAction.Download(file, Path.of("root", "video.mp4"))))
    },
    test("replaces changed files at their existing path") {
      val file = remote("1", "renamed.mp4", md5 = "new")
      val plan = SyncPlan.make(List(file), List(local("1", "root/video.mp4", "old")), Set.empty)
      assertTrue(plan == List(SyncAction.Replace(file, Path.of("root", "video.mp4"))))
    },
    test("skips unchanged files") {
      val plan = SyncPlan.make(
        List(remote("1", "video.mp4")),
        List(local("1", "root/video.mp4", "md5")),
        Set.empty
      )
      assertTrue(plan.isEmpty)
    },
    test("skips rejected files until their content changes") {
      val rejected = Set("1" -> "broken")
      val unchanged = SyncPlan.make(List(remote("1", "video.mp4", md5 = "broken")), Nil, rejected)
      val updated = SyncPlan.make(List(remote("1", "video.mp4", md5 = "fixed")), Nil, rejected)
      assertTrue(unchanged.isEmpty, updated.size == 1)
    },
    test("rejected files do not reserve paths") {
      val files = List(
        remote("broken", "video.mp4", md5 = "broken", createdAt = 1),
        remote("good", "video.mp4", createdAt = 2)
      )
      val plan = SyncPlan.make(files, Nil, Set("broken" -> "broken"))
      assertTrue(plan == List(SyncAction.Download(files(1), Path.of("root", "video.mp4"))))
    },
    test("never touches local files missing in Drive") {
      val plan = SyncPlan.make(Nil, List(local("1", "root/video.mp4", "md5")), Set.empty)
      assertTrue(plan.isEmpty)
    }
  )
}
