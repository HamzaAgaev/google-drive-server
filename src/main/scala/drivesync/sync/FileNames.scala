package drivesync.sync

import java.nio.file.Path

object FileNames {

  def withSuffix(path: Path, suffix: String): Path = {
    val name = path.getFileName.toString
    val dot = name.lastIndexOf('.')
    val (base, extension) = if (dot > 0) name.splitAt(dot) else (name, "")
    path.resolveSibling(s"$base$suffix$extension")
  }
}
