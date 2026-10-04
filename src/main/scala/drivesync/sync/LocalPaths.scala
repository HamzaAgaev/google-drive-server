package drivesync.sync

import java.nio.file.Path

import drivesync.google.RemoteFile

object LocalPaths {

  def assign(files: List[RemoteFile], existing: Map[String, Path]): Map[String, Path] = {
    val newFiles = files
      .filterNot(file => existing.contains(file.id))
      .sortBy(file => (file.createdTime.toEpochMilli, file.id))
    val (paths, _) = newFiles.foldLeft((existing, existing.values.toSet)) {
      case ((paths, taken), file) =>
        val path = uniquePath(desiredPath(file), taken)
        (paths + (file.id -> path), taken + path)
    }
    files.map(file => file.id -> paths(file.id)).toMap
  }

  private def desiredPath(file: RemoteFile): Path = {
    val segments = (file.folders :+ file.name).map(sanitize)
    Path.of(segments.head, segments.tail*)
  }

  private def sanitize(segment: String): String = {
    val cleaned = segment.trim.map(c => if (c == '/' || c == '\\' || c.isControl) '_' else c)
    if (cleaned.isEmpty || cleaned == "." || cleaned == "..") "_" else cleaned
  }

  private def uniquePath(path: Path, taken: Set[Path]): Path =
    (Iterator.single(path) ++ Iterator.from(2).map(withSuffix(path, _)))
      .find(candidate => !taken.contains(candidate))
      .get

  private def withSuffix(path: Path, n: Int): Path = {
    val name = path.getFileName.toString
    val dot = name.lastIndexOf('.')
    val (base, extension) = if (dot > 0) name.splitAt(dot) else (name, "")
    path.resolveSibling(s"$base ($n)$extension")
  }
}
