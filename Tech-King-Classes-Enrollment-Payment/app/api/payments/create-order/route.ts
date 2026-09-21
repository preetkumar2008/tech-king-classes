import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const courseId = String(body?.courseId || "");
    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local." },
        { status: 503 }
      );
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id,title,price,is_free,is_published")
      .eq("id", courseId)
      .eq("is_published", true)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not available" }, { status: 404 });
    }

    if (course.is_free) {
      return NextResponse.json({ error: "This is a free course. Use free enrollment." }, { status: 400 });
    }

    const amountInPaise = Math.round(Number(course.price) * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise <= 0) {
      return NextResponse.json({ error: "Course price is invalid" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "You are already enrolled in this course" }, { status: 409 });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `TKC-${Date.now()}`,
        notes: { course_id: course.id, user_id: user.id },
      }),
      cache: "no-store",
    });

    const razorpayOrder = await razorpayResponse.json();
    if (!razorpayResponse.ok) {
      return NextResponse.json(
        { error: razorpayOrder?.error?.description || "Unable to create Razorpay order" },
        { status: 502 }
      );
    }

    const { data: paymentId, error: paymentError } = await supabase.rpc("create_payment_record", {
      p_course_id: course.id,
      p_provider_order_id: razorpayOrder.id,
      p_amount: Number(course.price),
    });

    if (paymentError || !paymentId) {
      return NextResponse.json(
        { error: paymentError?.message || "Unable to save payment record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      keyId,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      courseTitle: course.title,
      paymentId,
    });
  } catch (error) {
    console.error("Razorpay create order error", error);
    return NextResponse.json({ error: "Unable to create payment order" }, { status: 500 });
  }
}
