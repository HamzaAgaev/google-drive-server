package drivesync.sync

import java.nio.file.{Files, Path, StandardCopyOption}
import java.security.MessageDigest
import java.util.HexFormat

import zio.*
import zio.stream.ZSink

import drivesync.config.AppConfig
import drivesync.google.{DriveClient, RemoteFile}

final case class NotAVideoException(name: String) extends Exception(s"Not a video file: $name")

final class Downloader(config: AppConfig, drive: DriveClient) {

  def download(file: RemoteFile, relativePath: Path): Task[Unit] = {
    val target = config.storage.videosDir.resolve(relativePath)
    val part = target.resolveSibling(s"${target.getFileName}.part")
    for {
      _ <- ZIO.attemptBlocking(Files.createDirectories(target.getParent))
      (_, digest) <- drive
        .download(file.id)
        .run(ZSink.fromPath(part).zipPar(ZSink.digest(MessageDigest.getInstance("MD5"))))
      md5 = HexFormat.of.formatHex(digest.toArray)
      _ <- ZIO.unless(md5 == file.md5) {
        ZIO.attemptBlocking(Files.deleteIfExists(part)) *>
          ZIO.fail(IllegalStateException(s"MD5 mismatch: expected ${file.md5}, got $md5"))
      }
      header <- ZIO.attemptBlocking {
        val input = Files.newInputStream(part)
        try input.readNBytes(VideoFormat.headerSize)
        finally input.close()
      }
      _ <- ZIO.unless(VideoFormat.isMp4(header)) {
        ZIO.attemptBlocking(Files.deleteIfExists(part)) *> ZIO.fail(NotAVideoException(file.name))
      }
      _ <- keepOldVersion(target)
      _ <- ZIO.attemptBlocking(Files.move(part, target, StandardCopyOption.ATOMIC_MOVE))
    } yield ()
  }

  private def keepOldVersion(target: Path): Task[Unit] =
    ZIO.attemptBlocking {
      if (Files.exists(target)) {
        val version = Iterator
          .from(1)
          .map(n => FileNames.withSuffix(target, s".v$n"))
          .find(path => !Files.exists(path))
          .get
        Files.move(target, version, StandardCopyOption.ATOMIC_MOVE)
      }
    }
}

object Downloader {

  val layer: ZLayer[AppConfig & DriveClient, Nothing, Downloader] =
    ZLayer.fromFunction(Downloader(_, _))
}
