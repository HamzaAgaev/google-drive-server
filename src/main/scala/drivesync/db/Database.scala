package drivesync.db

import java.nio.file.Files

import doobie.Transactor
import org.flywaydb.core.Flyway
import zio.*
import zio.interop.catz.*

import drivesync.config.AppConfig

object Database {

  val layer: ZLayer[AppConfig, Throwable, Transactor[Task]] =
    ZLayer.fromZIO(
      for {
        config <- ZIO.service[AppConfig]
        dbPath = config.storage.dbPath.toAbsolutePath
        url = s"jdbc:sqlite:$dbPath"
        _ <- ZIO.attemptBlocking(Files.createDirectories(dbPath.getParent))
        _ <- ZIO.attemptBlocking(Flyway.configure().dataSource(url, null, null).load().migrate())
      } yield Transactor.fromDriverManager[Task]("org.sqlite.JDBC", url, "", "", None)
    )
}
