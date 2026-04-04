import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const event_name = "delivery.created"

export default async function handler({
  event,
  container,
}: SubscriberArgs<any>) {
  console.log("📬 [EVENT][delivery.created]", event)

  const fulfillmentId = event.data?.id
  const noNotification = event.data?.no_notification

  // ✅ Notification logic
  let shouldSend = true
  if (typeof noNotification === "boolean") {
    shouldSend = !noNotification
  }

  console.log(
    `${shouldSend ? "📤" : "🚫"} [NOTIF][DELIVERY]`,
    {
      fulfillment_id: fulfillmentId,
      decision: shouldSend ? "SEND" : "SKIP",
      event_group: event.metadata?.eventGroupId,
    }
  )

  if (!shouldSend) return

  if (!fulfillmentId) {
    console.error("❌ Missing fulfillment id")
    return
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // ✅ MVP approach: get orders
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "display_id",

        // items
        "items.title",
        "items.quantity",
        "items.thumbnail",
        "items.variant.product.thumbnail",

        // fulfillments
        "fulfillments.id",
      ],
    })

    // ✅ Find order containing this fulfillment
    const order = orders.find((o: any) =>
      o.fulfillments?.some((f: any) => f.id === fulfillmentId)
    )

    if (!order || !order.email) {
      console.error("❌ Order not found for fulfillment", fulfillmentId)
      return
    }

    console.log("🔍 [DEBUG][ORDER]", order)

    // ✅ Build items HTML
    const itemsHtml = (order.items || [])
      .map((item: any) => {
        const qty = item.quantity ?? 1
        const image =
          item.thumbnail ||
          item.variant?.product?.thumbnail ||
          "https://via.placeholder.com/80"

        console.log("🧾 [ITEM]", {
          title: item.title,
          quantity: item.quantity,
          resolved_quantity: qty,
          image,
        })

        return `
          <tr>
            <td style="padding: 10px 0;">
              <img src="${image}" width="64" height="64" style="border-radius:6px;" />
            </td>
            <td style="padding: 10px;">
              <div style="font-weight:600;">${item.title}</div>
              <div style="color:#555;">Qty: ${qty}</div>
            </td>
          </tr>
        `
      })
      .join("")

    console.log("📧 Sending delivery email to:", order.email)

    await resend.emails.send({
      from: "Store <no-reply@notify.onefutbolasia-dev.xyz>",
      to: order.email,
      subject: `Your order #${order.display_id} has been delivered 📬`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">

            <h2>Your order has been delivered 📬</h2>

            <p>
              Your order <strong>#${order.display_id}</strong> has been successfully delivered.
            </p>

            <p>
              We hope everything arrived in perfect condition and that you enjoy your purchase!
            </p>

            <hr style="margin:20px 0;" />

            <h3>Order Summary</h3>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemsHtml}
            </table>

            <hr style="margin:20px 0;" />

            <p>
              Thank you for shopping with us. We look forward to serving you again!
            </p>

          </div>

          <div style="text-align:center; font-size:12px; color:#aaa; margin-top:12px;">
            © ${new Date().getFullYear()} Your Store
          </div>
        </div>
      `,
    })

    console.log("✅ [EMAIL SENT][delivery.created]", {
      to: order.email,
      order_id: order.id,
    })
  } catch (error) {
    console.error("❌ [ERROR][delivery.created]", error)
  }
}

export const config: SubscriberConfig = {
  event: event_name,
}