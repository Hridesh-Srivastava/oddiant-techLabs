import type { ReactNode } from "react";
import { Toaster } from "sonner";
import withAuth from "@/components/auth/withAuth";

// Define props type for layout
interface LayoutProps {
  children: ReactNode;
}

const EmployeeLayout = (props: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      {props.children}
    </div>
  );
};

export default withAuth(EmployeeLayout, "employee");
