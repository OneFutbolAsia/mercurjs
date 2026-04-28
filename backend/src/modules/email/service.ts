import { AbstractNotificationProviderService, MedusaError } from "@medusajs/framework/utils"
import { Resend } from "resend"
import { localTemplates } from "./templates"

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { emailTemplates } = require("@mercurjs/resend/providers/resend/email-templates")

type Options = {
  api_key: string
  from: string
}

class EmailNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  private resendClient: Resend
  private options: Options

  constructor(_: unknown, options: Options) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
  }

  async send(notification: any) {
    const from = notification.from?.trim() || this.options.from
    const localTemplate = localTemplates[notification.template]

    const sendOptions = localTemplate
      ? {
          from,
          to: notification.to,
          subject: localTemplate.subject,
          html: localTemplate.render(notification.data, notification.to),
        }
      : {
          from,
          to: notification.to,
          subject: notification.content?.subject,
          react: emailTemplates[notification.template]?.(notification.data),
        }

    if (!localTemplate && !emailTemplates[notification.template]) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Email template "${notification.template}" not found`
      )
    }

    const { data, error } = await this.resendClient.emails.send(sendOptions)
    if (error) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, error.message)
    if (!data) throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "No data returned by resend client")
    return data
  }
}

export default EmailNotificationProviderService
