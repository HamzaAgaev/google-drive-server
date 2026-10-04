package drivesync.web

import zio.test.*

object ByteRangeSpec extends ZIOSpecDefault {

  private def parse(header: String): ByteRange = ByteRange.parse(Some(header), size = 1000)

  def spec = suite("ByteRange")(
    test("no header means full file") {
      assertTrue(ByteRange.parse(None, 1000) == ByteRange.Full)
    },
    test("bounded range") {
      assertTrue(parse("bytes=100-199") == ByteRange.Partial(100, 199))
    },
    test("open-ended range goes to the end of file") {
      assertTrue(parse("bytes=500-") == ByteRange.Partial(500, 999))
    },
    test("suffix range takes last bytes") {
      assertTrue(
        parse("bytes=-100") == ByteRange.Partial(900, 999),
        parse("bytes=-5000") == ByteRange.Partial(0, 999)
      )
    },
    test("end beyond file size is clamped") {
      assertTrue(parse("bytes=900-5000") == ByteRange.Partial(900, 999))
    },
    test("start beyond file size is unsatisfiable") {
      assertTrue(
        parse("bytes=1000-") == ByteRange.Unsatisfiable,
        parse("bytes=-0") == ByteRange.Unsatisfiable
      )
    },
    test("unsupported or malformed headers fall back to full file") {
      assertTrue(
        parse("bytes=0-10,20-30") == ByteRange.Full,
        parse("bytes=200-100") == ByteRange.Full,
        parse("items=0-10") == ByteRange.Full,
        parse("bytes=99999999999999999999-") == ByteRange.Full
      )
    }
  )
}
