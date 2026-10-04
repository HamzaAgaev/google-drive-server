package drivesync.google

import java.time.Instant

import zio.*
import zio.http.*
import zio.json.*

final case class RemoteFile(
  id: String,
  folders: List[String],
  name: String,
  md5: String,
  createdTime: Instant
)

final class DriveClient(client: Client, tokens: AccessTokens) {

  private val filesUrl = url"https://www.googleapis.com/drive/v3/files"
  private val folderMimeType = "application/vnd.google-apps.folder"

  def listFilesRecursively(rootFolderId: String): Task[List[RemoteFile]] =
    for {
      visited <- Ref.make(Set.empty[String])
      root <- getItem(rootFolderId)
      files <- listFolder(root.id, List(root.name), visited)
    } yield files.distinctBy(_.id)

  private def listFolder(
    folderId: String,
    folders: List[String],
    visited: Ref[Set[String]]
  ): Task[List[RemoteFile]] =
    visited.modify(seen => (seen.contains(folderId), seen + folderId)).flatMap { alreadyVisited =>
      if (alreadyVisited) ZIO.succeed(Nil)
      else {
        for {
          children <- listChildren(folderId, pageToken = None)
          resolved <- ZIO.foreach(children)(resolveShortcut)
          (subfolders, items) = resolved.flatten.partition(_.mimeType == folderMimeType)
          files = items.collect { case DriveClient.Item(id, name, _, Some(md5), createdTime, _) =>
            RemoteFile(id, folders, name, md5, createdTime)
          }
          nested <- ZIO.foreach(subfolders) { folder =>
            listFolder(folder.id, folders :+ folder.name, visited)
          }
        } yield files ++ nested.flatten
      }
    }

  private def resolveShortcut(item: DriveClient.Item): Task[Option[DriveClient.Item]] =
    item.shortcutDetails match {
      case None => ZIO.some(item)
      case Some(shortcut) =>
        getItem(shortcut.targetId).asSome.catchSome {
          case error: GoogleApiException
              if error.status == Status.NotFound || error.status == Status.Forbidden =>
            ZIO.logWarning(s"Skipping shortcut '${item.name}': ${error.getMessage}").as(None)
        }
    }

  private def listChildren(
    folderId: String,
    pageToken: Option[String]
  ): Task[List[DriveClient.Item]] = {
    val url = filesUrl.addQueryParams(
      QueryParams(
        "q" -> s"'$folderId' in parents and trashed = false",
        "fields" -> s"nextPageToken, files(${DriveClient.itemFields})",
        "pageSize" -> "1000",
        "supportsAllDrives" -> "true",
        "includeItemsFromAllDrives" -> "true"
      )
    )
    for {
      page <- request[DriveClient.Page](pageToken.fold(url)(url.addQueryParam("pageToken", _)))
      rest <- page.nextPageToken match {
        case Some(next) => listChildren(folderId, Some(next))
        case None => ZIO.succeed(Nil)
      }
    } yield page.files ++ rest
  }

  private def getItem(id: String): Task[DriveClient.Item] =
    request[DriveClient.Item](
      (filesUrl / id).addQueryParams(
        QueryParams("fields" -> DriveClient.itemFields, "supportsAllDrives" -> "true")
      )
    )

  private def request[A: JsonDecoder](url: URL): Task[A] =
    tokens.get.flatMap { token =>
      GoogleApi.sendJson[A](client, Request.get(url).addHeader(Header.Authorization.Bearer(token)))
    }
}

object DriveClient {

  private val itemFields = "id, name, mimeType, md5Checksum, createdTime, shortcutDetails(targetId)"

  private final case class Item(
    id: String,
    name: String,
    mimeType: String,
    md5Checksum: Option[String],
    createdTime: Instant,
    shortcutDetails: Option[Shortcut]
  ) derives JsonDecoder

  private final case class Shortcut(targetId: String) derives JsonDecoder

  private final case class Page(files: List[Item], nextPageToken: Option[String])
    derives JsonDecoder

  val layer: ZLayer[Client & AccessTokens, Nothing, DriveClient] =
    ZLayer.fromFunction(DriveClient(_, _))
}
