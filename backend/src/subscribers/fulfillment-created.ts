import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const event_name = "order.fulfillment_created"

export default async function handler({
  event,
  container,
}: SubscriberArgs<any>) {
  console.log("📦 [EVENT][order.fulfillment_created]", event)

  const noNotification = event.data?.no_notification
  const orderId = event.data?.order_id
  const fulfillmentId = event.data?.fulfillment_id

  let shouldSend = true
  if (typeof noNotification === "boolean") {
    shouldSend = !noNotification
  }

  console.log(
    `${shouldSend ? "📤" : "🚫"} [NOTIF][FULFILLMENT]`,
    {
      order_id: orderId,
      fulfillment_id: fulfillmentId,
      no_notification: noNotification,
      decision: shouldSend ? "SEND" : "SKIP",
    }
  )

  if (!shouldSend) return

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: [order] } = await query.graph({
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
        "fulfillments.*",
      ],
      filters: { id: orderId },
    })

    if (!order || !order.email) {
      console.error("❌ [ERROR][ORDER]", { orderId })
      return
    }

    const fulfillment = order.fulfillments?.find(
      (f: any) => f.id === fulfillmentId
    )

    // 🔍 DEBUG
    console.log("🔍 [DEBUG][ORDER]", order)
    console.log("🔍 [DEBUG][FULFILLMENT]", fulfillment)

    // ✅ Items
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

    console.log("📧 Sending email to:", order.email)

    await resend.emails.send({
      from: "Store <no-reply@notify.onefutbolasia-dev.xyz>",
      to: order.email,
      subject: `Your order #${order.display_id} is being prepared 📦`,
      html: `
        <div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
          <div style="max-width:600px; margin:auto; background:#ffffff; padding:24px; border-radius:8px;">

            <h2>Thanks for shopping with us!</h2>

            <p>
              Your order <strong>#${order.display_id}</strong> is currently being prepared.
            </p>

            <p>
              We’ll notify you once it’s on the way 🚚
            </p>

            <hr style="margin:20px 0;" />

            <h3>Order Details</h3>

            <table width="100%" cellpadding="0" cellspacing="0">
              ${itemsHtml}
            </table>

            <hr style="margin:20px 0;" />

            <p>
              We hope you enjoy your purchase and see you again soon!
            </p>

          </div>

          <div style="text-align:center; font-size:12px; color:#aaa; margin-top:12px;">
            © ${new Date().getFullYear()} Your Store
          </div>
        </div>
      `,
    })

    console.log("✅ [EMAIL SENT]", { to: order.email })
  } catch (error) {
    console.error("❌ [ERROR][FULFILLMENT EMAIL]", error)
  }
}

export const config: SubscriberConfig = {
  event: event_name,
}