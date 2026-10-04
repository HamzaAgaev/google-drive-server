package drivesync

import zio.*

import drivesync.config.AppConfig

object Main extends ZIOAppDefault {

  private val program: ZIO[AppConfig, Nothing, Unit] =
    for {
      config <- ZIO.service[AppConfig]
      _ <- ZIO.logInfo(s"Configuration loaded: $config")
    } yield ()

  override def run: ZIO[Any, Any, Unit] =
    program.provide(AppConfig.layer)
}
