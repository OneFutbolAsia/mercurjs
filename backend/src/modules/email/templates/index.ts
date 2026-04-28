import { passwordResetTemplate } from "./password-reset"

export type LocalEmailTemplate = {
  subject: string
  render: (data: any, to: string) => string
}

export const localTemplates: Record<string, LocalEmailTemplate> = {
  forgotPasswordEmailTemplate: {
    subject: "Reset Your Password Request",
    render: passwordResetTemplate,
  },
}
