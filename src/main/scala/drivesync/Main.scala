package drivesync

import zio.*
import zio.http.Client

import drivesync.config.AppConfig
import drivesync.db.{CredentialsRepository, Database, FileRepository}
import drivesync.google.{AccessTokens, AuthCommand, DriveClient, GoogleOAuth}
import drivesync.sync.{Downloader, Syncer}

object Main extends ZIOAppDefault {

  override def run: ZIO[ZIOAppArgs, Any, Unit] =
    getArgs.flatMap { args =>
      args.toList match {
        case Nil =>
          ZIO
            .serviceWithZIO[Syncer](_.runForever)
            .provide(
              AppConfig.layer,
              Database.layer,
              FileRepository.layer,
              Downloader.layer,
              Syncer.layer,
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
