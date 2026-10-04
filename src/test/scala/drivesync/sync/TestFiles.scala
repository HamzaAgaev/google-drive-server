package drivesync.sync

import java.time.Instant

import drivesync.google.RemoteFile

object TestFiles {

  def remote(
    id: String,
    name: String,
    folders: List[String] = List("root"),
    md5: String = "md5",
    createdAt: Long = 0
  ): RemoteFile =
    RemoteFile(id, folders, name, md5, Instant.ofEpochSecond(createdAt))
}
