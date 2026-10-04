package drivesync.db

import java.nio.file.Path
import java.time.Instant

import doobie.*
import doobie.implicits.*
import zio.*
import zio.interop.catz.*

final case class DownloadedFile(
  driveId: String,
  path: Path,
  md5: String,
  createdTime: Instant
)

final class FileRepository(xa: Transactor[Task]) {

  private given Meta[Path] = Meta[String].timap(Path.of(_))(_.toString)
  private given Meta[Instant] = Meta[Long].timap(Instant.ofEpochMilli)(_.toEpochMilli)

  def findAll: Task[List[DownloadedFile]] =
    sql"SELECT drive_id, path, md5, created_time FROM files"
      .query[DownloadedFile]
      .to[List]
      .transact(xa)

  def upsert(file: DownloadedFile): Task[Unit] =
    sql"""
      INSERT INTO files (drive_id, path, md5, created_time)
      VALUES (${file.driveId}, ${file.path}, ${file.md5}, ${file.createdTime})
      ON CONFLICT (drive_id) DO UPDATE SET
        path = excluded.path,
        md5 = excluded.md5,
        created_time = excluded.created_time
    """.update.run.transact(xa).unit
}

object FileRepository {

  val layer: ZLayer[Transactor[Task], Nothing, FileRepository] =
    ZLayer.fromFunction(FileRepository(_))
}
