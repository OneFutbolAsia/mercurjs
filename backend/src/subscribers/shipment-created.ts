import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const event_name = "shipment.created"

export default async function handler({
  event,
  container,
}: SubscriberArgs<any>) {
  console.log("🚚 [EVENT][shipment.created]", event)

  const fulfillmentId = event.data?.id
  const noNotification = event.data?.no_notification

  // ✅ Notification logic
  let shouldSend = true
  if (typeof noNotification === "boolean") {
    shouldSend = !noNotification
  }

  console.log(
    `${shouldSend ? "📤" : "🚫"} [NOTIF][SHIPMENT]`,
    {
      fulfillment_id: fulfillmentId,
      decision: shouldSend ? "SEND" : "SKIP",
    }
  )

  if (!shouldSend) return

  if (!fulfillmentId) {
    console.error("❌ Missing fulfillment id")
    return
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    // ✅ STEP 1: get orders (MVP approach)
    const { data: orders } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "email",
        "display_id",

        "items.title",
        "items.quantity",
        "items.thumbnail",
        "items.variant.product.thumbnail",

        "fulfillments.id",
      ],
    })

    // ✅ STEP 2: find order containing fulfillment
    const order = orders.find((o: any) =>
      o.fulfillments?.some((f: any) => f.id === fulfillmentId)
    )

    if (!order || !order.email) {
      console.error("❌ Order not found for fulfillment", fulfillmentId)
      return
    }

    console.log("🔍 [DEBUG][ORDER]", order)

    // ✅ Items HTML
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

    console.log("📧 Sending shipment email to:", order.email)

    await resend.emails.send({
      from: "Store <no-reply@notify.onefutbolasia-dev.xyz>",
      to: order.email,
      subject: `Your order #${order.display_id} is on the way 🚚`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">

            <h2>Your order is on the way 🚚</h2>

            <p>
              Great news! Your order <strong>#${order.display_id}</strong> has been shipped.
            </p>

            <p>
              Your order is now on its way to you. We’ll let you know as soon as it has been delivered.
            </p>

            <hr style="margin:20px 0;" />

            <h3>Items in your shipment</h3>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemsHtml}
            </table>

            <hr style="margin:20px 0;" />

            <p>Thank you for shopping with us!</p>

          </div>

          <div style="text-align:center; font-size:12px; color:#aaa; margin-top:12px;">
            © ${new Date().getFullYear()} Your Store
          </div>
        </div>
      `,
    })

    console.log("✅ [EMAIL SENT][shipment.created]", {
      to: order.email,
      order_id: order.id,
    })
  } catch (error) {
    console.error("❌ [ERROR][shipment.created]", error)
  }
}

export const config: SubscriberConfig = {
  event: event_name,
}