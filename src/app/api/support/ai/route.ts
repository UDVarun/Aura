import { NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { runSupportFlow } from "@/lib/support/orchestrator";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { message, conversationId } = await request.json();
  const supabase = await createServerSupabase(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!message || !conversationId) {
    return new Response("Message and conversationId are required.", { status: 400 });
  }

  const result = await runSupportFlow({
    supabase,
    userId: user.id,
    conversationId,
    message,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));
      const words = result.reply.split(" ");

      for (const word of words) {
        send(`${word} `);
        await new Promise((resolve) => setTimeout(resolve, 12));
      }

      if (result.ticket?.id) {
        send(`\n\nEscalation created: ${result.ticket.id}`);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
