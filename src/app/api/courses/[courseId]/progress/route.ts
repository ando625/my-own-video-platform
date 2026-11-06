import { withLogin } from "@/lib/api-route";
import {
  markCourseCompleted,
  unmarkCourseCompleted,
} from "@/services/progress-service";

type CourseRouteContext = {
  params: Promise<{ courseId: string }>;
};

export const PUT = withLogin(
  async (user, _request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    await markCourseCompleted(user.id, courseId);
    return Response.json({ completed: true });
  },
);

export const DELETE = withLogin(
  async (user, _request, { params }: CourseRouteContext) => {
    const { courseId } = await params;
    await unmarkCourseCompleted(user.id, courseId);
    return Response.json({ completed: false });
  },
);
