// app/admin/employee/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // This is the correct signature
) {
  try {
    const employeeId = params.id;

    if (!employeeId) {
      return NextResponse.json(
        { success: false, message: "Employee ID is required" },
        { status: 400 }
      );
    }

    // Database connection
    const { db } = await connectToDatabase();

    // Employee query
    let employee;
    try {
      employee = await db
        .collection("employees")
        .findOne({ _id: new ObjectId(employeeId) });
    } catch (error) {
      console.error("MongoDB query error:", error);
      return NextResponse.json(
        { success: false, message: "Invalid employee ID format" },
        { status: 400 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const { password, ...safeEmployeeData } = employee;

    // Response headers
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");
    headers.set("Pragma", "no-cache");

    return NextResponse.json(
      { success: true, employee: safeEmployeeData },
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}