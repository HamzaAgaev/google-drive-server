package drivesync

import zio.*
import zio.http.Client

import drivesync.config.AppConfig
import drivesync.db.{CredentialsRepository, Database, FileRepository}
import drivesync.google.{AuthCommand, GoogleOAuth}

object Main extends ZIOAppDefault {

  private val serve: ZIO[FileRepository, Throwable, Unit] =
    for {
      files <- ZIO.serviceWithZIO[FileRepository](_.findAll)
      _ <- ZIO.logInfo(s"Downloaded files in database: ${files.size}")
    } yield ()

  override def run: ZIO[ZIOAppArgs, Any, Unit] =
    getArgs.flatMap { args =>
      args.toList match {
        case Nil =>
          serve.provide(AppConfig.layer, Database.layer, FileRepository.layer)
        case List("auth") =>
          AuthCommand.run.provide(
            AppConfig.layer,
            Database.layer,
            CredentialsRepository.layer,
            GoogleOAuth.layer,
            Client.default
          )
        case other =>
          ZIO.fail(s"Unknown command: ${other.mkString(" ")}")
      }
    }
}
