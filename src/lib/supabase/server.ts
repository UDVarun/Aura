import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

import { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

function normalizeCookies(source: NextRequest["cookies"] | ReadonlyRequestCookies) {
    return {
        getAll() {
            return source.getAll().map(({ name, value }) => ({ name, value: value ?? "" }));
        },
        setAll() {
            // noop: server helper only reads cookies by default
        },
    };
}

export async function createServerSupabase(request?: NextRequest) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error("Missing Supabase env vars for server client.");
    }

    const cookieSource = request?.cookies ?? (await cookies());

    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: normalizeCookies(cookieSource),
    });
}
