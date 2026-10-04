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
      val plan = SyncPlan.make(List(file), Nil)
      assertTrue(plan == List(SyncAction.Download(file, Path.of("root", "video.mp4"))))
    },
    test("replaces changed files at their existing path") {
      val file = remote("1", "renamed.mp4", md5 = "new")
      val plan = SyncPlan.make(List(file), List(local("1", "root/video.mp4", "old")))
      assertTrue(plan == List(SyncAction.Replace(file, Path.of("root", "video.mp4"))))
    },
    test("skips unchanged files") {
      val plan =
        SyncPlan.make(List(remote("1", "video.mp4")), List(local("1", "root/video.mp4", "md5")))
      assertTrue(plan.isEmpty)
    },
    test("never touches local files missing in Drive") {
      val plan = SyncPlan.make(Nil, List(local("1", "root/video.mp4", "md5")))
      assertTrue(plan.isEmpty)
    }
  )
}
