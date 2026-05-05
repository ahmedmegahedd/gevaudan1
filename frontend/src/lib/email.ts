import { Resend } from "resend"
import { storeConfig } from "@/config/store.config"

const resendKey = process.env.RESEND_API_KEY
const resend = resendKey ? new Resend(resendKey) : null

const FROM_ADDRESS =
  process.env.RESEND_FROM_ADDRESS ?? `${storeConfig.brand.name} <onboarding@resend.dev>`

export interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    return { error: "RESEND_API_KEY is not configured" }
  }

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })

  if (error) {
    return { error: error.message ?? "Failed to send email" }
  }
  return { data }
}

export interface BackInStockEmailParams {
  productName: string
  productUrl: string
  productImage?: string | null
}

/**
 * Branded back-in-stock email — burgundy primary + wine accent.
 * Inline styles only (most email clients strip <style> tags or class-based CSS).
 */
export function buildBackInStockEmail({
  productName,
  productUrl,
  productImage,
}: BackInStockEmailParams): string {
  const { brand, theme } = storeConfig
  const navy = theme.primaryColor
  const accent = theme.accentColor

  const imageBlock = productImage
    ? `
        <tr>
          <td style="padding: 0 32px 32px 32px;">
            <img
              src="${productImage}"
              alt="${escapeHtml(productName)}"
              width="100%"
              style="display: block; width: 100%; max-width: 480px; height: auto; border-radius: 4px;"
            />
          </td>
        </tr>`
    : ""

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(productName)} is back in stock</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #F1E9D9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #ffffff;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1E9D9; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${navy}; border-radius: 4px; overflow: hidden;">
            <!-- Brand header -->
            <tr>
              <td align="center" style="padding: 40px 32px 24px 32px; border-bottom: 1px solid rgba(255,255,255,0.08);">
                <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 500; letter-spacing: 0.04em; color: ${accent};">
                  ${escapeHtml(brand.name)}
                </p>
                <p style="margin: 6px 0 0 0; font-size: 10px; letter-spacing: 0.3em; color: rgba(255,255,255,0.5); text-transform: uppercase;">
                  ${escapeHtml(brand.subtitle ?? "")}
                </p>
              </td>
            </tr>

            <!-- Eyebrow -->
            <tr>
              <td align="center" style="padding: 40px 32px 8px 32px;">
                <p style="margin: 0; font-size: 11px; letter-spacing: 0.3em; color: ${accent}; text-transform: uppercase;">
                  Back in Stock
                </p>
              </td>
            </tr>

            <!-- Headline -->
            <tr>
              <td align="center" style="padding: 0 32px 24px 32px;">
                <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-weight: 500; font-size: 32px; line-height: 1.2; letter-spacing: 0.02em; color: #ffffff;">
                  Good news — ${escapeHtml(productName)} is back.
                </h1>
              </td>
            </tr>

            <!-- Body copy -->
            <tr>
              <td align="center" style="padding: 0 32px 32px 32px;">
                <p style="margin: 0; font-size: 16px; line-height: 1.8; color: rgba(255,255,255,0.75); max-width: 440px;">
                  You asked to be notified when this piece returned. It just landed back in our collection — and we wanted you to know first.
                </p>
              </td>
            </tr>

            ${imageBlock}

            <!-- CTA -->
            <tr>
              <td align="center" style="padding: 0 32px 40px 32px;">
                <a href="${productUrl}" style="display: inline-block; padding: 0 48px; height: 52px; line-height: 52px; background-color: ${accent}; color: #ffffff; font-size: 11px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; text-decoration: none; border-radius: 2px;">
                  Shop Now
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding: 24px 32px 32px 32px; border-top: 1px solid rgba(255,255,255,0.08);">
                <p style="margin: 0; font-size: 10px; letter-spacing: 0.2em; color: rgba(255,255,255,0.4); text-transform: uppercase;">
                  © ${new Date().getFullYear()} ${escapeHtml(brand.name)}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.7;">
                  You received this because you subscribed to a back-in-stock alert.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
