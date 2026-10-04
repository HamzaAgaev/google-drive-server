package drivesync.sync

import drivesync.google.RemoteFile

object VariantSelector {

  def select(files: List[RemoteFile], priority: List[String]): List[RemoteFile] =
    if (priority.isEmpty) files
    else {
      val markers = priority.filter(_.nonEmpty)
      val selectedIds = files
        .groupBy(file => (file.folders, recordingName(file.name, markers)))
        .values
        .flatMap { recording =>
          val ranked = recording.flatMap(file => rank(file.name, markers, priority).map(_ -> file))
          val best = ranked.map(_._1).minOption
          ranked.collect { case (rank, file) if best.contains(rank) => file.id }
        }
        .toSet
      files.filter(file => selectedIds.contains(file.id))
    }

  private def rank(name: String, markers: List[String], priority: List[String]): Option[Int] = {
    val variant = markers.find(name.contains).getOrElse("")
    Some(priority.indexOf(variant)).filter(_ >= 0)
  }

  private def recordingName(name: String, markers: List[String]): String =
    markers.foldLeft(name)(_.replace(_, " ")).replaceAll("\\s+", " ").trim
}
