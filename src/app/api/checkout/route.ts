import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatOrderNumber, requireRole } from "@/lib/marketplace";
import { parsePriceValue } from "@/lib/currency";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabase(request);
        const { user } = await requireRole(supabase, ["customer"]);
        const payload = await request.json();

        const { data: cartItems, error: cartError } = await supabase
            .from("cart_items")
            .select("product_id, product_name, product_price, product_image, product_category, quantity")
            .eq("user_id", user.id);

        if (cartError) {
            return NextResponse.json({ error: cartError.message }, { status: 400 });
        }

        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
        }

        const productIds = cartItems.map((item) => item.product_id);
        const { data: products, error: productsError } = await supabase
            .from("products")
            .select("id, vendor_id, title")
            .in("id", productIds);

        if (productsError) {
            return NextResponse.json({ error: productsError.message }, { status: 400 });
        }

        const productMap = new Map((products ?? []).map((product) => [product.id, product]));
        const subtotal = cartItems.reduce((sum, item) => sum + parsePriceValue(item.product_price) * Number(item.quantity), 0);
        const shippingAmount = Number(payload.shippingAmount ?? 0);
        const taxAmount = Number(payload.taxAmount ?? 0);
        const totalAmount = subtotal + shippingAmount + taxAmount;

        const orderNumber = formatOrderNumber();
        const shippingAddress = {
            firstName: payload.firstName ?? "",
            lastName: payload.lastName ?? "",
            email: payload.email ?? "",
            phone: payload.phone ?? "",
            address: payload.address ?? "",
            city: payload.city ?? "",
            state: payload.state ?? "",
            zip: payload.zip ?? "",
            country: payload.country ?? "India",
        };

        const { data: order, error: orderError } = await supabase
            .from("orders")
            .insert({
                customer_id: user.id,
                order_number: orderNumber,
                status: "placed",
                payment_status: "paid",
                fulfillment_status: "pending_vendor_ack",
                subtotal,
                shipping_amount: shippingAmount,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                payment_method: payload.paymentMethod ?? "upi",
                shipping_address: shippingAddress,
            })
            .select("id, order_number")
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: orderError?.message ?? "Failed to create order." }, { status: 400 });
        }

        const orderItems = cartItems.map((item) => {
            const product = productMap.get(item.product_id);
            if (!product?.vendor_id) {
                throw new Error(`Product ${item.product_name} is missing a vendor.`);
            }

            const normalizedPrice = parsePriceValue(item.product_price);
            const lineTotal = normalizedPrice * Number(item.quantity);
            return {
                order_id: order.id,
                product_id: item.product_id,
                vendor_id: product.vendor_id,
                customer_id: user.id,
                product_title: product.title ?? item.product_name,
                quantity: item.quantity,
                price_at_time: normalizedPrice,
                line_total: lineTotal,
                status: "placed",
                shipment_status: "pending",
            };
        });

        const { error: orderItemsError } = await supabase
            .from("order_items")
            .insert(orderItems);

        if (orderItemsError) {
            return NextResponse.json({ error: orderItemsError.message }, { status: 400 });
        }

        await supabase.from("cart_items").delete().eq("user_id", user.id);

        return NextResponse.json({ orderId: order.id, orderNumber: order.order_number });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Checkout failed.";
        const status = message === "Authentication required" ? 401 : message === "Forbidden" ? 403 : 500;
        return NextResponse.json({ error: message }, { status });
    }
}
