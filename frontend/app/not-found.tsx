import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/layout/status-page";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="We couldn't find that page"
      description="The link may be broken, or the page may have moved. Check the address or head somewhere useful below."
    >
      <Button asChild>
        <Link href="/">Go to homepage</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href="/courses">Browse courses</Link>
      </Button>
    </StatusPage>
  );
}
