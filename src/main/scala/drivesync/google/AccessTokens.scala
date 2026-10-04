package drivesync.google

import java.time.Instant

import zio.*

import drivesync.db.CredentialsRepository

final class AccessTokens(
  oauth: GoogleOAuth,
  credentials: CredentialsRepository,
  cache: Ref.Synchronized[Option[AccessTokens.Cached]]
) {

  private val expiryMargin = 1.minute

  def get: Task[String] =
    cache.modifyZIO { cached =>
      Clock.instant.flatMap { now =>
        cached match {
          case Some(token) if token.expiresAt.isAfter(now.plus(expiryMargin)) =>
            ZIO.succeed(token.value -> cached)
          case _ =>
            refresh(now).map(token => token.value -> Some(token))
        }
      }
    }

  private def refresh(now: Instant): Task[AccessTokens.Cached] =
    for {
      refreshToken <- credentials.findRefreshToken.someOrFail(
        IllegalStateException("No Google authorization, run the `auth` command first")
      )
      response <- oauth.refresh(refreshToken)
    } yield AccessTokens.Cached(response.accessToken, now.plusSeconds(response.expiresIn))
}

object AccessTokens {

  final case class Cached(value: String, expiresAt: Instant)

  val layer: ZLayer[GoogleOAuth & CredentialsRepository, Nothing, AccessTokens] =
    ZLayer {
      for {
        oauth <- ZIO.service[GoogleOAuth]
        credentials <- ZIO.service[CredentialsRepository]
        cache <- Ref.Synchronized.make(Option.empty[Cached])
      } yield AccessTokens(oauth, credentials, cache)
    }
}
