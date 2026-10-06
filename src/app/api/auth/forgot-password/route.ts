import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid email" },
        { status: 400 }
      );
    }

    // 1. Look up user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // We do NOT reveal whether the user exists to prevent enumeration.
    // If they exist, we proceed to generate token and send email.
    if (user) {
      // 2. Generate random reset token (raw)
      const resetToken = crypto.randomBytes(32).toString("hex");

      // 3. Hash it for the database
      const passwordResetToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // 4. Set expiration (1 hour from now)
      const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

      // 5. Update user in DB
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken,
          passwordResetExpires,
        },
      });

      // 6. Send the email
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      await sendEmail({
        to: user.email,
        subject: "Reset your Aryahs password",
        text: `We received a request to reset your Aryahs account password.\n\nPlease go to the following link to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Reset your password</h2>
            <p>We received a request to reset your Aryahs account password.</p>
            <p>Click the button below to reset it. This link will expire in 1 hour.</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p style="margin-top: 20px; font-size: 12px; color: #666;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    }

    // Always return generic response to prevent email enumeration
    return NextResponse.json(
      { success: true, message: "If an account exists for this email, a password reset link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, message: "Unable to process the password reset request." },
      { status: 500 }
    );
  }
}
