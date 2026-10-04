package drivesync.google

import zio.*
import zio.http.*
import zio.json.*

import drivesync.config.AppConfig

@jsonMemberNames(SnakeCase)
final case class TokenResponse(
  accessToken: String,
  expiresIn: Long,
  refreshToken: Option[String]
) derives JsonDecoder

final class GoogleOAuth(config: AppConfig, client: Client) {

  private val scope = "https://www.googleapis.com/auth/drive.readonly"
  private val tokenUrl = url"https://oauth2.googleapis.com/token"

  def authorizationUrl(redirectUri: String, state: String, codeChallenge: String): URL =
    url"https://accounts.google.com/o/oauth2/v2/auth".addQueryParams(
      QueryParams(
        "client_id" -> config.drive.clientId,
        "redirect_uri" -> redirectUri,
        "response_type" -> "code",
        "scope" -> scope,
        "access_type" -> "offline",
        "prompt" -> "consent",
        "state" -> state,
        "code_challenge" -> codeChallenge,
        "code_challenge_method" -> "S256"
      )
    )

  def exchangeCode(code: String, redirectUri: String, codeVerifier: String): Task[TokenResponse] =
    requestToken(
      "client_id" -> config.drive.clientId,
      "client_secret" -> config.drive.clientSecret,
      "code" -> code,
      "code_verifier" -> codeVerifier,
      "redirect_uri" -> redirectUri,
      "grant_type" -> "authorization_code"
    )

  private def requestToken(form: (String, String)*): Task[TokenResponse] =
    for {
      response <- client.batched(
        Request.post(tokenUrl, Body.fromURLEncodedForm(Form.fromStrings(form*)))
      )
      body <- response.body.asString
      _ <- ZIO
        .fail(IllegalStateException(s"Google token request failed: ${response.status} $body"))
        .unless(response.status.isSuccess)
      tokens <- ZIO.fromEither(body.fromJson[TokenResponse]).mapError(IllegalStateException(_))
    } yield tokens
}

object GoogleOAuth {

  val layer: ZLayer[AppConfig & Client, Nothing, GoogleOAuth] =
    ZLayer.fromFunction(GoogleOAuth(_, _))
}
