import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { EmployeeNavbar } from "@/components/layout/employee-navbar"

export default function JobApplicantsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <EmployeeNavbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-10 w-24 mb-6">
          <Skeleton className="h-full w-full" />
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="grid grid-cols-8 bg-gray-50 p-3">
                <Skeleton className="h-5 w-20" />
                <div className="col-span-2">
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
                <div className="col-span-2">
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>

              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="grid grid-cols-8 border-t p-3 items-center">
                  <Skeleton className="h-5 w-5" />
                  <div className="col-span-2 flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-2" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <div className="col-span-2">
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
