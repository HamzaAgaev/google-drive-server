package drivesync.sync

import java.nio.charset.StandardCharsets

object VideoFormat {

  val headerSize = 8

  def isMp4(header: Array[Byte]): Boolean =
    header.length >= headerSize &&
      new String(header, 4, 4, StandardCharsets.US_ASCII) == "ftyp"
}
