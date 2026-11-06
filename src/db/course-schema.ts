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
  thumbnailPath: text("thumbnail_path"),
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

export const sections = sqliteTable(
  "sections",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("sections_course_id_idx").on(table.courseId)],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => sections.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    youtubeVideoId: text("youtube_video_id").notNull(),
    position: integer("position").notNull(),
  },
  (table) => [index("lessons_section_id_idx").on(table.sectionId)],
);

export const lessonProgress = sqliteTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    index("lesson_progress_lesson_id_idx").on(table.lessonId),
  ],
);
