type Data = {
  data: { url: string }
}

export function passwordResetTemplate({ data }: Data, to: string): string {
  const resetUrl = data?.url ?? "#"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

          <tr>
            <td style="background:#000000;padding:24px 32px;">
              <img
                src="${process.env.BACKEND_URL ?? "http://localhost:9000"}/static/images/logo_100x100.png"
                alt="Onefutbol"
                height="36"
                style="display:block;"
              />
            </td>
          </tr>

          <tr>
            <td style="padding:40px 32px;">
              <p style="margin:0 0 16px;font-size:13px;color:#888888;">${to}</p>
              <h2 style="margin:0 0 16px;font-size:20px;color:#111111;">Have you forgotten your password?</h2>
              <p style="margin:0 0 12px;font-size:15px;color:#444444;line-height:1.6;">
                We received a request to reset the password for your <strong>Onefutbol</strong> account.
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#444444;line-height:1.6;">
                To set a new password, please click the button below:
              </p>

              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#000000;border-radius:6px;">
                    <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;color:#666666;line-height:1.6;">
                This link is valid for the next <strong>24 hours</strong> for security purposes.
              </p>
              <p style="margin:0 0 12px;font-size:14px;color:#666666;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email—your account will remain unchanged.
              </p>
              <p style="margin:0;font-size:14px;color:#666666;line-height:1.6;">
                If you need any assistance, feel free to contact our support team.
              </p>
            </td>
          </tr>

          <tr>
            <td style="background:#f9f9f9;padding:24px 32px;border-top:1px solid #eeeeee;">
              <p style="margin:0 0 4px;font-size:14px;color:#333333;font-weight:600;">Best regards,</p>
              <p style="margin:0 0 8px;font-size:14px;color:#333333;font-weight:700;">OneFutbol Team</p>
              <a href="https://www.onefutbol.asia" style="font-size:13px;color:#000000;text-decoration:underline;">
                www.onefutbol.asia
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
