import { NextRequest, NextResponse } from "next/server";
import arcjet from "@/app/lib/arcjet";
import { sendOptInEmail } from "@/app/lib/nodemailer";
import supabase from "@/app/lib/supabase";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email")!;

  const decision = await arcjet.protect(req, { email });
  if (decision.isDenied()) {
    if (decision.reason.isShield()) {
      console.log("Suspicious action detected!");
      return NextResponse.json(
        { error: "Suspicious action detected!" },
        { status: 403 }
      );
    }
    if (decision.reason.isBot()) {
      console.log("Looks like you might be a bot!");
      return NextResponse.json(
        { error: "Looks like you might be a bot!" },
        { status: 403 }
      );
    }
  }
  return NextResponse.json({ data: "Hello World!" });
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const email = data.email;

  const decision = await arcjet.protect(req, { email });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      const resetTime = decision.reason.resetTime;
      if (!resetTime) {
        return NextResponse.json(
          { error: "Too many requests. Try again later." },
          { status: 429 }
        );
      }

      const remainingTime = Math.max(
        0,
        Math.floor((resetTime.getTime() - Date.now()) / 1000)
      );
      const timeUnit = remainingTime > 60 ? "minutes" : "seconds";
      const timeValue =
        timeUnit === "minutes" ? Math.ceil(remainingTime / 60) : remainingTime;

      return NextResponse.json(
        { error: `Too many requests. Try again in ${timeValue} ${timeUnit}.` },
        { status: 429 }
      );
    }
    if (decision.reason.isEmail()) {
      const errorType = decision.reason.emailTypes;
      if (errorType.includes("INVALID")) {
        return NextResponse.json(
          { error: "Invalid email format. Check your spelling." },
          { status: 400 }
        );
      } else if (errorType.includes("DISPOSABLE")) {
        return NextResponse.json(
          { error: "Disposable email address. Check your spelling." },
          { status: 400 }
        );
      } else if (errorType.includes("NO_MX_RECORDS")) {
        return NextResponse.json(
          { error: "Email without an MX record. Check your spelling." },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Invalid email. Check your spelling." },
          { status: 400 }
        );
      }
    }
  }
  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .from("subscribers")
      .select("*")
      .eq("email", email);

    if (error) {
      console.error("Error checking email:", error);
      return false;
    }

    return data.length > 0;
  };

  const handleEmailSubmission = async (email: string) => {
    const emailExists = await checkEmailExists(email);

    if (emailExists) {
      return NextResponse.json(
        { error: "This email has already been registered." },
        { status: 500 }
      );
    } else {
      const token = uuidv4();

      const { error } = await supabase
        .from("pending_subscriptions")
        .insert({ email, token });

      if (error) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      await sendOptInEmail(email, token);
      return NextResponse.json({ data: "Success" }, { status: 200 });
    }
  };

  return await handleEmailSubmission(email);
}
