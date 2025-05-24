import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const employeeId = params.id;

    // Validate employee ID format first
    if (!ObjectId.isValid(employeeId)) {
      return NextResponse.json(
        { success: false, message: "Invalid employee ID format" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    const employee = await db.collection("employees").findOne({ 
      _id: new ObjectId(employeeId) 
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // Remove sensitive fields
    const { password, ...safeEmployeeData } = employee;

    return NextResponse.json(
      { success: true, data: safeEmployeeData },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "CDN-Cache-Control": "no-store",
          "Vercel-CDN-Cache-Control": "no-store"
        }
      }
    );
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}