package drivesync.sync

import zio.*

import drivesync.config.AppConfig
import drivesync.db.{DownloadedFile, FileRepository}
import drivesync.google.DriveClient

final class Syncer(
  config: AppConfig,
  drive: DriveClient,
  downloader: Downloader,
  repository: FileRepository
) {

  val runForever: UIO[Unit] =
    runOnce
      .catchAll(error => ZIO.logErrorCause("Sync failed", Cause.fail(error)))
      .repeat(Schedule.spaced(config.sync.interval))
      .unit

  def runOnce: Task[Unit] =
    for {
      remote <- ZIO.foreach(config.drive.folderIds)(drive.listFilesRecursively)
      selected = VariantSelector.select(
        remote.flatten.distinctBy(_.id),
        config.sync.variantPriority
      )
      local <- repository.findAll
      plan = SyncPlan.make(selected, local)
      _ <- ZIO.logInfo(s"Remote files: ${selected.size}, to download: ${plan.size}")
      _ <- ZIO
        .foreachParDiscard(plan.zipWithIndex) { case (action, index) =>
          execute(action, s"${index + 1}/${plan.size}")
            .catchAll(error => ZIO.logErrorCause(s"Failed: $action", Cause.fail(error)))
        }
        .withParallelism(config.sync.parallelDownloads.max(1))
    } yield ()

  private def execute(action: SyncAction, progress: String): Task[Unit] = {
    val (file, path) = action match {
      case SyncAction.Download(file, path) => (file, path)
      case SyncAction.Replace(file, path) => (file, path)
    }
    for {
      _ <- ZIO.logInfo(s"[$progress] ${action.productPrefix}: $path")
      _ <- downloader.download(file, path)
      _ <- repository.upsert(DownloadedFile(file.id, path, file.md5, file.createdTime))
    } yield ()
  }
}

object Syncer {

  val layer: ZLayer[AppConfig & DriveClient & Downloader & FileRepository, Nothing, Syncer] =
    ZLayer.fromFunction(Syncer(_, _, _, _))
}
