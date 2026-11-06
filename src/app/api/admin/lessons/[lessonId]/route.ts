import { readJsonBody, withAdmin } from "@/lib/admin-route";
import { deleteLesson, updateLesson } from "@/services/curriculum-service";

type LessonRouteContext = {
  params: Promise<{ lessonId: string }>;
};

export const PATCH = withAdmin(
  async (request, { params }: LessonRouteContext) => {
    const { lessonId } = await params;
    const lesson = await updateLesson(lessonId, await readJsonBody(request));
    return Response.json({ lesson });
  },
);

export const DELETE = withAdmin(
  async (_request, { params }: LessonRouteContext) => {
    const { lessonId } = await params;
    await deleteLesson(lessonId);
    return Response.json({ success: true });
  },
);
