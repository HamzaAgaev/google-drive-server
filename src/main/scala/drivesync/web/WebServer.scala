package drivesync.web

import java.nio.channels.{Channels, FileChannel}
import java.nio.file.{Files, Path}

import zio.*
import zio.http.*
import zio.stream.ZStream

import drivesync.config.AppConfig
import drivesync.db.FileRepository

object WebServer {

  val run: ZIO[AppConfig & FileRepository, Throwable, Nothing] =
    ZIO.serviceWithZIO[AppConfig] { config =>
      Server
        .serve(routes)
        .provideSome[AppConfig & FileRepository](
          Server.defaultWith(_.binding(config.http.host, config.http.port))
        )
    }

  private val routes: Routes[AppConfig & FileRepository, Nothing] =
    Routes(
      Method.GET / Root -> handler(index),
      Method.GET / "watch" / string("id") -> handler((id: String, _: Request) => watch(id)),
      Method.GET / "files" / string("id") -> handler((id: String, request: Request) =>
        file(id, request)
      )
    ).handleErrorCauseZIO(cause =>
      ZIO.logErrorCause("Request failed", cause).as(Response.status(Status.InternalServerError))
    )

  private val index: ZIO[FileRepository, Throwable, Response] =
    ZIO.serviceWithZIO[FileRepository](_.findAll).map { files =>
      Response.html(Pages.index(Catalog.courses(files)))
    }

  private def watch(id: String): ZIO[FileRepository, Throwable, Response] =
    ZIO.serviceWithZIO[FileRepository](_.findAll).map { files =>
      Catalog.watch(files, id).fold(Response.notFound)(watch => Response.html(Pages.watch(watch)))
    }

  private def file(
    id: String,
    request: Request
  ): ZIO[AppConfig & FileRepository, Throwable, Response] =
    for {
      config <- ZIO.service[AppConfig]
      stored <- ZIO.serviceWithZIO[FileRepository](_.find(id))
      response <- stored match {
        case Some(file) =>
          serve(config.storage.videosDir.resolve(file.path), request.rawHeader("Range"))
        case None => ZIO.succeed(Response.notFound)
      }
    } yield response

  private def serve(path: Path, range: Option[String]): Task[Response] =
    ZIO.attemptBlocking(Option.when(Files.isRegularFile(path))(Files.size(path))).map {
      case None => Response.notFound
      case Some(size) =>
        val contentType = MediaType
          .forFileExtension(path.getFileName.toString.split('.').last)
          .getOrElse(MediaType.application.`octet-stream`)
        val response = ByteRange.parse(range, size) match {
          case ByteRange.Full =>
            Response(Status.Ok, body = Body.fromStream(read(path, 0, size), size))
          case ByteRange.Partial(start, end) =>
            Response(
              Status.PartialContent,
              body = Body.fromStream(read(path, start, end - start + 1), end - start + 1)
            ).addHeader("Content-Range", s"bytes $start-$end/$size")
          case ByteRange.Unsatisfiable =>
            Response
              .status(Status.RequestedRangeNotSatisfiable)
              .addHeader("Content-Range", s"bytes */$size")
        }
        response.addHeader(Header.ContentType(contentType)).addHeader("Accept-Ranges", "bytes")
    }

  private def read(path: Path, start: Long, length: Long): ZStream[Any, Throwable, Byte] =
    ZStream
      .scoped(ZIO.fromAutoCloseable(ZIO.attemptBlocking(FileChannel.open(path).position(start))))
      .flatMap(channel => ZStream.fromInputStream(Channels.newInputStream(channel)))
      .take(length)
}
