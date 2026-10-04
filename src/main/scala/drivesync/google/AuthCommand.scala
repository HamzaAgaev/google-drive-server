package drivesync.google

import java.security.MessageDigest
import java.util.Base64

import zio.*
import zio.http.*

import drivesync.config.AppConfig
import drivesync.db.CredentialsRepository

object AuthCommand {

  val run: ZIO[AppConfig & GoogleOAuth & CredentialsRepository, Throwable, Unit] =
    for {
      config <- ZIO.service[AppConfig]
      oauth <- ZIO.service[GoogleOAuth]
      port = config.drive.authRedirectPort
      redirectUri = s"http://127.0.0.1:$port/callback"
      state <- randomToken
      codeVerifier <- randomToken
      authUrl = oauth.authorizationUrl(redirectUri, state, codeChallenge(codeVerifier))
      code <- awaitCode(port, state) <& Console.printLine(s"Open in browser:\n${authUrl.encode}")
      tokens <- oauth.exchangeCode(code, redirectUri, codeVerifier)
      refreshToken <- ZIO
        .fromOption(tokens.refreshToken)
        .orElseFail(new IllegalStateException("Google did not return a refresh token"))
      _ <- ZIO.serviceWithZIO[CredentialsRepository](_.saveRefreshToken(refreshToken))
      _ <- ZIO.logInfo("Google authorization saved")
    } yield ()

  private def awaitCode(port: Int, expectedState: String): Task[String] =
    ZIO.scoped {
      for {
        promise <- Promise.make[Throwable, String]
        routes = Routes(
          Method.GET / "callback" -> handler { (request: Request) =>
            val result = callbackResult(request, expectedState)
            val text = result.fold(error => s"Error: $error", _ => "Done, you can close this tab")
            promise
              .complete(ZIO.fromEither(result).mapError(IllegalStateException(_)))
              .as(Response.text(text))
          }
        )
        server <- Server.defaultWith(_.binding("127.0.0.1", port)).build
        _ <- Server.install(routes).provideEnvironment(server)
        code <- promise.await
      } yield code
    }

  private def callbackResult(request: Request, expectedState: String): Either[String, String] =
    (request.queryParam("error"), request.queryParam("state"), request.queryParam("code")) match {
      case (Some(error), _, _) => Left(s"Google returned error: $error")
      case (_, state, _) if !state.contains(expectedState) => Left("State mismatch")
      case (_, _, Some(code)) => Right(code)
      case _ => Left("No authorization code in callback")
    }

  private val randomToken: UIO[String] =
    Random.nextBytes(32).map(bytes => base64Url(bytes.toArray))

  private def codeChallenge(codeVerifier: String): String =
    base64Url(MessageDigest.getInstance("SHA-256").digest(codeVerifier.getBytes("US-ASCII")))

  private def base64Url(bytes: Array[Byte]): String =
    Base64.getUrlEncoder.withoutPadding.encodeToString(bytes)
}
