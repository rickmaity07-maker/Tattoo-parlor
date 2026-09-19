import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Basic in-memory rate limit (per server instance). Good enough to stop
// accidental double-submits and light abuse from a single visitor; a
// serverless deploy with multiple instances would need a shared store
// (e.g. Redis) for a hard guarantee, but this is a public inquiry form,
// not a payment endpoint.
const recentSubmissionsByIp = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 30_000;

const BookingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Enter a valid email").max(200),
  preferredArtist: z.string().trim().max(200).optional().default(""),
  idea: z.string().trim().min(1, "Tell us a little about the idea").max(2000),
  // Honeypot field — real visitors never fill this in.
  company: z.string().max(0).optional().default(""),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const lastSubmit = recentSubmissionsByIp.get(ip);
  if (lastSubmit && Date.now() - lastSubmit < RATE_LIMIT_WINDOW_MS) {
    return NextResponse.json(
      { error: "Please wait a moment before submitting again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = BookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 }
    );
  }
  const { name, email, preferredArtist, idea } = parsed.data;

  if (!process.env.DATABASE_URL) {
    console.error("Booking submission failed: DATABASE_URL is not configured.");
    return NextResponse.json(
      { error: "Booking is temporarily unavailable. Please email us directly." },
      { status: 503 }
    );
  }

  try {
    const booking = await prisma.bookingRequest.create({
      data: {
        name,
        email,
        preferredArtist: preferredArtist || null,
        idea,
        sourceIp: ip,
      },
    });

    // Email notification — non-fatal if it fails; the booking request is
    // already saved either way and can be reviewed later.
    const resendKey = process.env.RESEND_API_KEY;
    const notifyEmail = process.env.BOOKING_NOTIFY_EMAIL;
    if (resendKey && notifyEmail) {
      try {
        const resend = new Resend(resendKey);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "Iron Rose Tattoo Co. <onboarding@resend.dev>",
          to: notifyEmail,
          replyTo: email,
          subject: `New booking inquiry — ${name}`,
          text: [
            `New booking inquiry via the website:`,
            ``,
            `Name: ${name}`,
            `Email: ${email}`,
            `Preferred artist: ${preferredArtist || "No preference"}`,
            `Idea: ${idea}`,
            ``,
            `Booking ID: ${booking.id}`,
          ].join("\n"),
        });
      } catch (emailErr) {
        console.error("Booking notification email failed to send:", emailErr);
      }
    }

    recentSubmissionsByIp.set(ip, Date.now());
    return NextResponse.json({ ok: true, id: booking.id }, { status: 201 });
  } catch (err) {
    console.error("Booking submission failed:", err);
    return NextResponse.json(
      { error: "Something went wrong sending your request. Please try again." },
      { status: 500 }
    );
  }
}
