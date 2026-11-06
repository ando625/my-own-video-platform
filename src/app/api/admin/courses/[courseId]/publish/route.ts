import { withAdmin } from "@/lib/api-route";
import { publishCourse } from "@/services/course-service";

type CourseRouteContext = {
  params: Promise<{ courseId: string }>;
};

export const POST = withAdmin(
  async (_request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    return Response.json({ course: await publishCourse(courseId) });
  },
);
