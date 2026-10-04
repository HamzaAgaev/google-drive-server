CREATE TABLE rejected_files (
  drive_id TEXT NOT NULL,
  md5 TEXT NOT NULL,
  PRIMARY KEY (drive_id, md5)
);
