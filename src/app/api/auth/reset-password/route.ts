import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // 1. Hash the provided raw token to look it up in the database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2. Find user by this token and check expiration
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: {
          gt: new Date(), // token must not be expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "This password reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    // 3. Hash the new password using the existing logic
    const newPasswordHash = await hashPassword(password);

    // 4. Update the user's password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Password reset successfully." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to process the password reset request." },
      { status: 500 }
    );
  }
}
