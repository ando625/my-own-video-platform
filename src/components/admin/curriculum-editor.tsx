"use client";

import { useState } from "react";
import { useAdminAction } from "@/hooks/use-admin-action";
import { adminFetch } from "@/lib/admin-api-client";
import { DeleteButton } from "./delete-button";
import { MoveButtons } from "./move-buttons";
import {
  errorTextClass,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "./ui";

type Lesson = {
  id: string;
  title: string;
  youtubeVideoId: string;
};

type Section = {
  id: string;
  title: string;
  lessons: Lesson[];
};

function LessonItem({
  lesson,
  isFirst,
  isLast,
}: {
  lesson: Lesson;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [videoUrl, setVideoUrl] = useState("");
  const { isPending, errorMessage, run } = useAdminAction();

  return (
    <li
      aria-label={`レッスン: ${lesson.title}`}
      className="flex flex-col gap-2 rounded-md border border-foreground/10 p-3"
    >
      <form
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await adminFetch(`/lessons/${lesson.id}`, "PATCH", {
              title,
              ...(videoUrl.trim() ? { youtubeUrl: videoUrl } : {}),
            });
            setVideoUrl("");
          });
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          レッスン名
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <p className="text-xs text-foreground/60">
          動画ID: {lesson.youtubeVideoId}
        </p>
        <label className="flex flex-col gap-1 text-sm">
          動画のURLを変更（変更するときだけ入力）
          <input
            className={inputClass}
            value={videoUrl}
            onChange={(event) => setVideoUrl(event.target.value)}
          />
        </label>
        {errorMessage && (
          <p role="alert" className={errorTextClass}>
            {errorMessage}
          </p>
        )}
        <div>
          <button
            type="submit"
            className={secondaryButtonClass}
            disabled={isPending}
          >
            レッスンを保存
          </button>
        </div>
      </form>
      <div className="flex flex-wrap items-center gap-2">
        <MoveButtons
          movePath={`/lessons/${lesson.id}/move`}
          itemName="レッスン"
          isFirst={isFirst}
          isLast={isLast}
        />
        <div className="ml-auto">
          <DeleteButton
            label="レッスンを削除"
            confirmMessage={`レッスン「${lesson.title}」と受講者の進捗を削除します。元に戻せません。`}
            onDelete={async () => {
              await adminFetch(`/lessons/${lesson.id}`, "DELETE");
            }}
          />
        </div>
      </div>
    </li>
  );
}

function AddLessonForm({ sectionId }: { sectionId: string }) {
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const { isPending, errorMessage, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-2 rounded-md bg-foreground/5 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          await adminFetch(`/sections/${sectionId}/lessons`, "POST", {
            title,
            youtubeUrl,
          });
          setTitle("");
          setYoutubeUrl("");
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm">
        新しいレッスン名
        <input
          className={inputClass}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        YouTubeのURL
        <input
          className={inputClass}
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
        />
      </label>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
      <div>
        <button
          type="submit"
          className={primaryButtonClass}
          disabled={isPending}
        >
          レッスンを追加
        </button>
      </div>
    </form>
  );
}

function SectionItem({
  section,
  isFirst,
  isLast,
}: {
  section: Section;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [title, setTitle] = useState(section.title);
  const { isPending, errorMessage, run } = useAdminAction();

  return (
    <li
      aria-label={`セクション: ${section.title}`}
      className="flex flex-col gap-3 rounded-lg border border-foreground/20 p-4"
    >
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await adminFetch(`/sections/${section.id}`, "PATCH", { title });
          });
        }}
      >
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-sm font-medium">
          セクション名
          <input
            className={inputClass}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <button
          type="submit"
          className={secondaryButtonClass}
          disabled={isPending}
        >
          セクションを保存
        </button>
      </form>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <MoveButtons
          movePath={`/sections/${section.id}/move`}
          itemName="セクション"
          isFirst={isFirst}
          isLast={isLast}
        />
        <div className="ml-auto">
          <DeleteButton
            label="セクションを削除"
            confirmMessage={`セクション「${section.title}」と、配下のレッスン、受講者の進捗を削除します。元に戻せません。`}
            onDelete={async () => {
              await adminFetch(`/sections/${section.id}`, "DELETE");
            }}
          />
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {section.lessons.map((lesson, index) => (
          <LessonItem
            key={lesson.id}
            lesson={lesson}
            isFirst={index === 0}
            isLast={index === section.lessons.length - 1}
          />
        ))}
      </ul>
      <AddLessonForm sectionId={section.id} />
    </li>
  );
}

function AddSectionForm({ courseId }: { courseId: string }) {
  const [title, setTitle] = useState("");
  const { isPending, errorMessage, run } = useAdminAction();

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void run(async () => {
          await adminFetch(`/courses/${courseId}/sections`, "POST", { title });
          setTitle("");
        });
      }}
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        新しいセクション名
        <input
          className={inputClass}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>
      {errorMessage && (
        <p role="alert" className={errorTextClass}>
          {errorMessage}
        </p>
      )}
      <div>
        <button
          type="submit"
          className={primaryButtonClass}
          disabled={isPending}
        >
          セクションを追加
        </button>
      </div>
    </form>
  );
}

export function CurriculumEditor({
  courseId,
  sections,
}: {
  courseId: string;
  sections: Section[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">カリキュラム</h2>
      <ul className="flex flex-col gap-4">
        {sections.map((section, index) => (
          <SectionItem
            key={section.id}
            section={section}
            isFirst={index === 0}
            isLast={index === sections.length - 1}
          />
        ))}
      </ul>
      <AddSectionForm courseId={courseId} />
    </section>
  );
}
