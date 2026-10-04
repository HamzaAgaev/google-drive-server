package drivesync.db

import doobie.*
import doobie.implicits.*
import zio.*
import zio.interop.catz.*

final class CredentialsRepository(xa: Transactor[Task]) {

  def findRefreshToken: Task[Option[String]] =
    sql"SELECT refresh_token FROM google_credentials WHERE id = 1"
      .query[String]
      .option
      .transact(xa)

  def saveRefreshToken(token: String): Task[Unit] =
    sql"""
      INSERT INTO google_credentials (id, refresh_token)
      VALUES (1, $token)
      ON CONFLICT (id) DO UPDATE SET refresh_token = excluded.refresh_token
    """.update.run.transact(xa).unit
}

object CredentialsRepository {

  val layer: ZLayer[Transactor[Task], Nothing, CredentialsRepository] =
    ZLayer.fromFunction(CredentialsRepository(_))
}
