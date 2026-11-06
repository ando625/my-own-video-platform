import { readJsonBody, withAdmin } from "@/lib/admin-route";
import {
  deleteCourse,
  getCourse,
  updateCourse,
} from "@/services/course-service";
import { getCurriculum } from "@/services/curriculum-service";

type CourseRouteContext = {
  params: Promise<{ courseId: string }>;
};

export const GET = withAdmin(
  async (_request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    const course = await getCourse(courseId);
    return Response.json({
      course,
      sections: await getCurriculum(courseId),
    });
  },
);

export const PATCH = withAdmin(
  async (request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    const course = await updateCourse(courseId, await readJsonBody(request));
    return Response.json({ course });
  },
);

export const DELETE = withAdmin(
  async (_request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    await deleteCourse(courseId);
    return Response.json({ success: true });
  },
);
