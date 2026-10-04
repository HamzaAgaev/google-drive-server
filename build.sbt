ThisBuild / scalaVersion := "3.9.0"

val zioVersion = "2.1.26"
val zioConfigVersion = "4.1.0"

lazy val root = (project in file("."))
  .settings(
    name := "google-drive-server",
    scalacOptions ++= Seq(
      "-deprecation",
      "-feature",
      "-Wunused:all",
      "-no-indent",
      "-old-syntax",
      "-release",
      "21"
    ),
    libraryDependencies ++= Seq(
      "dev.zio" %% "zio" % zioVersion,
      "dev.zio" %% "zio-config-magnolia" % zioConfigVersion,
      "dev.zio" %% "zio-config-typesafe" % zioConfigVersion
    ),
    run / fork := true
  )
