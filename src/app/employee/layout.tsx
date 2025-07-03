import type { ReactNode } from "react";
import { Toaster } from "sonner";

interface LayoutProps {
  children: ReactNode;
}

export default function EmployeeLayout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      {children}
    </div>
  );
}
