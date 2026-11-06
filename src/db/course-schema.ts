import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

const currentTimestampMs = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const courses = sqliteTable("courses", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeVideoId: text("youtube_video_id").notNull(),
  thumbnailFileName: text("thumbnail_file_name"),
  status: text("status", { enum: ["draft", "published"] })
    .default("draft")
    .notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(currentTimestampMs)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(currentTimestampMs)
    .$onUpdate(() => new Date())
    .notNull(),
});

export const courseProgress = sqliteTable(
  "course_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.courseId] }),
    index("course_progress_course_id_idx").on(table.courseId),
  ],
);
