import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudflare/r2";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        // 1. Authenticate the user (ensure only admins/vendors can upload)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check role
        const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("id", user.id)
            .single();

        const role = roleData?.role ?? "customer";
        if (role !== "admin" && role !== "vendor") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Parse the form data
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 3. Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // 4. Generate a unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split(".").pop();
        const fileName = `${user.id}-${timestamp}.${fileExtension}`;

        // 5. Upload to Cloudflare R2
        const imageUrl = await uploadImage(buffer, fileName, file.type);

        return NextResponse.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error("Upload handler error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
