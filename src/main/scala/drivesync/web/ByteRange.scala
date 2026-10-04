package drivesync.web

enum ByteRange {
  case Full
  case Partial(start: Long, end: Long)
  case Unsatisfiable
}

object ByteRange {

  private val Bounded = """bytes=(\d{1,18})-(\d{1,18})""".r
  private val OpenEnded = """bytes=(\d{1,18})-""".r
  private val Suffix = """bytes=-(\d{1,18})""".r

  def parse(header: Option[String], size: Long): ByteRange =
    header.map(_.trim) match {
      case Some(Bounded(start, end)) if start.toLong <= end.toLong =>
        partial(start.toLong, end.toLong, size)
      case Some(OpenEnded(start)) => partial(start.toLong, size - 1, size)
      case Some(Suffix(length)) if length.toLong > 0 =>
        partial(math.max(size - length.toLong, 0), size - 1, size)
      case Some(Suffix(_)) => Unsatisfiable
      case _ => Full
    }

  private def partial(start: Long, end: Long, size: Long): ByteRange =
    if (start >= size) Unsatisfiable else Partial(start, math.min(end, size - 1))
}
