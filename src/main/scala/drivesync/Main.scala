package drivesync

import zio.*
import zio.http.Client

import drivesync.config.AppConfig
import drivesync.db.{CredentialsRepository, Database}
import drivesync.google.{AccessTokens, AuthCommand, DriveClient, GoogleOAuth}

object Main extends ZIOAppDefault {

  private val serve: ZIO[AppConfig & DriveClient, Throwable, Unit] =
    for {
      config <- ZIO.service[AppConfig]
      drive <- ZIO.service[DriveClient]
      _ <- ZIO.foreachDiscard(config.drive.folderIds) { folderId =>
        drive.listFilesRecursively(folderId).flatMap { files =>
          ZIO.logInfo(s"Folder $folderId: ${files.size} files") *>
            ZIO.foreachDiscard(files) { file =>
              ZIO.logInfo((file.folders :+ file.name).mkString("/"))
            }
        }
      }
    } yield ()

  override def run: ZIO[ZIOAppArgs, Any, Unit] =
    getArgs.flatMap { args =>
      args.toList match {
        case Nil =>
          serve.provide(
            AppConfig.layer,
            Database.layer,
            CredentialsRepository.layer,
            GoogleOAuth.layer,
            AccessTokens.layer,
            DriveClient.layer,
            Client.default
          )
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
