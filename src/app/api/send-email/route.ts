import { NextResponse } from "next/server";
import type { Todo } from "@/types/todo";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email, todos } = (await request.json()) as {
      email?: string;
      todos?: Todo[];
    };
    if (!email || !Array.isArray(todos)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === "true",
      auth:
        process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
          : undefined,
    });

    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;">
        <h2 style="margin: 0 0 8px 0;">Your Todo List</h2>
        <p style="margin: 0 0 12px 0; color: #555">${new Date().toLocaleString()}</p>
        <ul style="padding-left: 16px;">
          ${(todos ?? [])
            .map(
              (t) =>
                `<li><strong>${escapeHtml(t.title)}</strong>${
                  t.description ? ` — ${escapeHtml(t.description)}` : ""
                } ${t.completed ? "(Completed)" : ""}</li>`
            )
            .join("")}
        </ul>
      </div>
    `;

    const info = await transporter.sendMail({
      from:
        process.env.MAIL_FROM ??
        process.env.SMTP_USER ??
        "no-reply@example.com",
      to: email,
      subject: `Your Todo List (${todos.length} items)`,
      html,
    });

    return NextResponse.json({ messageId: info.messageId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
