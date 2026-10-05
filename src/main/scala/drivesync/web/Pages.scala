package drivesync.web

import java.time.ZoneId
import java.time.format.DateTimeFormatter

import zio.http.template.*

import drivesync.db.DownloadedFile

object Pages {

  private val dateFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy").withZone(ZoneId.systemDefault)

  private val css =
    """
      |:root { color-scheme: light dark; --muted: #6b7280; --accent: #2563eb; }
      |body { font-family: system-ui, sans-serif; max-width: 960px; margin: 0 auto; padding: 16px; }
      |a { color: var(--accent); text-decoration: none; }
      |a:hover { text-decoration: underline; }
      |ul { list-style: none; padding: 0; }
      |li { display: flex; justify-content: space-between; gap: 16px; padding: 6px 0; }
      |.muted { color: var(--muted); white-space: nowrap; }
      |video { width: 100%; max-height: 80vh; background: #000; }
      |nav { display: flex; justify-content: space-between; gap: 16px; margin: 16px 0; }
      |""".stripMargin

  def index(courses: List[Course]): Html =
    page(
      "Лекции",
      h1("Лекции"),
      if (courses.isEmpty) p("Пока нет скачанных видео")
      else
        div(courses.map { course =>
          section(
            h2(Catalog.courseTitle(course.folder)),
            ul(course.videos.map { video =>
              li(
                a(hrefAttr := watchUrl(video), Catalog.videoTitle(video)),
                span(classAttr := "muted", dateFormat.format(video.createdTime))
              )
            })
          )
        })
    )

  def watch(watch: Watch): Html =
    page(
      Catalog.videoTitle(watch.video),
      nav(a(hrefAttr := "/", "← Все курсы")),
      h1(Catalog.videoTitle(watch.video)),
      p(classAttr := "muted", Catalog.courseTitle(watch.course.folder)),
      video(
        controlsAttr := "",
        preloadAttr := "metadata",
        srcAttr := s"/files/${watch.video.driveId}"
      ),
      nav(
        div(watch.previous.map(video => a(hrefAttr := watchUrl(video), "← Предыдущее")).toList),
        div(watch.next.map(video => a(hrefAttr := watchUrl(video), "Следующее →")).toList)
      )
    )

  private def page(pageTitle: String, content: Html*): Html =
    html(
      langAttr := "ru",
      head(
        meta(charsetAttr := "utf-8"),
        meta(nameAttr := "viewport", contentAttr := "width=device-width, initial-scale=1"),
        title(pageTitle),
        style(css)
      ),
      body(content*)
    )

  private def watchUrl(video: DownloadedFile): String = s"/watch/${video.driveId}"
}
