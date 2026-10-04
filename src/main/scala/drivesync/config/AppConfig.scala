package drivesync.config

import java.nio.file.Path

import zio.*
import zio.config.*
import zio.config.magnolia.*
import zio.config.typesafe.*

final case class DriveConfig(
  folderIds: List[String],
  clientId: String,
  clientSecret: String,
  authRedirectPort: Int
)

final case class SyncConfig(
  interval: Duration,
  variantPriority: List[String],
  parallelDownloads: Int
)

final case class StorageConfig(videosDir: Path, dbPath: Path)

final case class HttpConfig(host: String, port: Int)

final case class AppConfig(
  drive: DriveConfig,
  sync: SyncConfig,
  storage: StorageConfig,
  http: HttpConfig
)

object AppConfig {

  private given DeriveConfig[Path] = DeriveConfig[String].map(Path.of(_))

  private given DeriveConfig[List[String]] =
    DeriveConfig(Config.listOf(Config.string).map(_.flatMap(_.split(",").map(_.trim))))

  val descriptor: Config[AppConfig] = deriveConfig[AppConfig].mapKey(toKebabCase)

  val layer: ZLayer[Any, Config.Error, AppConfig] =
    ZLayer.fromZIO(TypesafeConfigProvider.fromResourcePath().load(descriptor))
}
