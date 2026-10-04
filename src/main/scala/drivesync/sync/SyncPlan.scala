package drivesync.sync

import java.nio.file.Path

import drivesync.db.DownloadedFile
import drivesync.google.RemoteFile

enum SyncAction {
  case Download(file: RemoteFile, path: Path)
  case Replace(file: RemoteFile, path: Path)
}

object SyncPlan {

  def make(remote: List[RemoteFile], local: List[DownloadedFile]): List[SyncAction] = {
    val localById = local.map(file => file.driveId -> file).toMap
    val paths = LocalPaths.assign(remote, localById.view.mapValues(_.path).toMap)
    remote.flatMap { file =>
      localById.get(file.id) match {
        case None => Some(SyncAction.Download(file, paths(file.id)))
        case Some(existing) if existing.md5 != file.md5 =>
          Some(SyncAction.Replace(file, existing.path))
        case Some(_) => None
      }
    }
  }
}
