import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function ExportacionesLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>

      <Card className="p-5">
        <Skeleton className="h-9 w-48 rounded-lg" />
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </Card>
    </div>
  );
}
