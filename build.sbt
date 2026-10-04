ThisBuild / scalaVersion := "3.9.0"

val zioVersion = "2.1.26"
val zioConfigVersion = "4.1.0"
val doobieVersion = "1.0.0-RC12"

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
      "dev.zio" %% "zio-config-typesafe" % zioConfigVersion,
      "dev.zio" %% "zio-interop-cats" % "23.1.0.14",
      "dev.zio" %% "zio-http" % "3.11.6",
      "dev.zio" %% "zio-json" % "1.1.0",
      "org.tpolecat" %% "doobie-core" % doobieVersion,
      "org.xerial" % "sqlite-jdbc" % "3.53.4.0",
      "org.flywaydb" % "flyway-core" % "13.9.0"
    ),
    run / fork := true
  )
