import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/layout/status-page";

export default function CourseNotFound() {
  return (
    <StatusPage
      code="404"
      title="Course not found"
      description="This course doesn't exist or is no longer available. It may have been unpublished by its author."
    >
      <Button asChild>
        <Link href="/courses">Browse all courses</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </StatusPage>
  );
}
