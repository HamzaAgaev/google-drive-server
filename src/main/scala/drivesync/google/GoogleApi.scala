package drivesync.google

import zio.*
import zio.http.*
import zio.json.*

final case class GoogleApiException(request: Request, status: Status, body: String)
  extends Exception(s"${request.method} ${request.url.path} failed: $status $body")

object GoogleApi {

  def sendJson[A: JsonDecoder](client: Client, request: Request): Task[A] =
    for {
      response <- client.batched(request)
      body <- response.body.asString
      _ <- ZIO
        .fail(GoogleApiException(request, response.status, body))
        .unless(response.status.isSuccess)
      result <- ZIO.fromEither(body.fromJson[A]).mapError(IllegalStateException(_))
    } yield result
}
