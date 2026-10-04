package drivesync.sync

import java.nio.charset.StandardCharsets

import zio.test.*

object VideoFormatSpec extends ZIOSpecDefault {

  private def bytes(text: String): Array[Byte] = text.getBytes(StandardCharsets.ISO_8859_1)

  def spec = suite("VideoFormat")(
    test("accepts MP4 with ftyp box") {
      assertTrue(VideoFormat.isMp4(bytes("\u0000\u0000\u0000 ftypisom")))
    },
    test("rejects HTML saved as mp4") {
      assertTrue(!VideoFormat.isMp4(bytes("<!doctype html>\n<html")))
    },
    test("rejects too short files") {
      assertTrue(!VideoFormat.isMp4(bytes("ftyp")), !VideoFormat.isMp4(Array.emptyByteArray))
    }
  )
}
