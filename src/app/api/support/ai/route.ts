import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { message } = await request.json();
  const supabase = await createServerSupabase();
  
  // Get current user for contextual order lookup
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Search Knowledge Base
  const { data: articles } = await supabase
    .from("support_articles")
    .select("title, content, slug")
    .textSearch("fts", message, { config: "english" })
    .limit(2);

  let context = "";
  if (articles && articles.length > 0) {
    context = `Based on our knowledge base: ${articles.map((a: any) => a.content).join(" ")}`;
  }

  // 2. Fetch User Orders (Enterprise Context)
  let orderContext = "";
  if (user) {
    const { data: orders } = await supabase
      .from("orders")
      .select("order_number, status, total_amount, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3);

    if (orders && orders.length > 0) {
      orderContext = `You have ${orders.length} recent orders. The most recent is #${orders[0].order_number} which is currently ${orders[0].status}.`;
    }
  }

  // 3. Simulate Advanced AI Streaming Response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => controller.enqueue(encoder.encode(text));

      // Intelligent routing logic simulation
      const lowerMsg = message.toLowerCase();
      
      if (lowerMsg.includes("order") && orderContext) {
        send("🔍 **Checking your order status...**\n\n");
        await new Promise(r => setTimeout(r, 600));
        send(`${orderContext}\n\nWould you like more details on a specific order, or do you have another question?`);
      } else if (context) {
        send("📖 **I found the following in our help articles:**\n\n");
        const lines = context.split(". ");
        for (const line of lines) {
          if (line.trim()) {
            send(line + ". ");
            await new Promise(r => setTimeout(r, 40));
          }
        }
        send("\n\nDid this resolve your query? If not, I can escalate this to a live agent.");
      } else {
        const fallback = "I'm sorry, I couldn't find a direct answer in our system. I've logged your request, and I can connect you with a specialist right now. Would you like to start a live chat?";
        for (const word of fallback.split(" ")) {
          send(word + " ");
          await new Promise(r => setTimeout(r, 25));
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
