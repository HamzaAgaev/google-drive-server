package drivesync

import zio.*

import drivesync.config.AppConfig
import drivesync.db.{Database, FileRepository}

object Main extends ZIOAppDefault {

  private val program: ZIO[FileRepository, Throwable, Unit] =
    for {
      files <- ZIO.serviceWithZIO[FileRepository](_.findAll)
      _ <- ZIO.logInfo(s"Downloaded files in database: ${files.size}")
    } yield ()

  override def run: ZIO[Any, Any, Unit] =
    program.provide(AppConfig.layer, Database.layer, FileRepository.layer)
}
