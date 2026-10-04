package drivesync

import zio.*
import zio.http.Client

import drivesync.config.AppConfig
import drivesync.db.{CredentialsRepository, Database, FileRepository}
import drivesync.google.{AccessTokens, AuthCommand, DriveClient, GoogleOAuth}
import drivesync.sync.{SyncPlan, VariantSelector}

object Main extends ZIOAppDefault {

  private val serve: ZIO[AppConfig & DriveClient & FileRepository, Throwable, Unit] =
    for {
      config <- ZIO.service[AppConfig]
      drive <- ZIO.service[DriveClient]
      remote <- ZIO.foreach(config.drive.folderIds)(drive.listFilesRecursively)
      selected = VariantSelector.select(
        remote.flatten.distinctBy(_.id),
        config.sync.variantPriority
      )
      local <- ZIO.serviceWithZIO[FileRepository](_.findAll)
      plan = SyncPlan.make(selected, local)
      _ <- ZIO.logInfo(s"Remote files: ${remote.flatten.size}, selected: ${selected.size}")
      _ <- ZIO.foreachDiscard(plan)(action => ZIO.logInfo(action.toString))
    } yield ()

  override def run: ZIO[ZIOAppArgs, Any, Unit] =
    getArgs.flatMap { args =>
      args.toList match {
        case Nil =>
          serve.provide(
            AppConfig.layer,
            Database.layer,
            FileRepository.layer,
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
