import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "You must be logged in",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: currentUser.user,
      business: currentUser.business,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
