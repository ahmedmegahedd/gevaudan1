import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components"
import { storeConfig } from "@/config/store.config"
import { formatOrderNumber } from "@/lib/orderNumber"
import type { Order } from "@/types"

// Brand primary (deep burgundy) and accent (wine). The NAVY/ACCENT names
// are legacy from the previous palette — kept to minimize the diff.
const NAVY = "#5C1F2A"
const ACCENT = "#8B3A48"
const PAGE_BG = "#F1E9D9"
const TEXT_LIGHT = "rgba(255,255,255,0.75)"
const DIVIDER_LIGHT = "rgba(255,255,255,0.08)"
const DIVIDER_DARK = "rgba(61,20,25,0.1)"
const BODY_TEXT = "rgba(61,20,25,0.75)"
const MUTED_TEXT = "rgba(61,20,25,0.5)"

interface OrderConfirmationProps {
  order: Order
}

export default function OrderConfirmation({ order }: OrderConfirmationProps) {
  const { brand, delivery } = storeConfig
  const currency = delivery.currency
  const shortId = formatOrderNumber(order.order_number)
  const waNumber = brand.whatsapp.replace(/[^0-9]/g, "")
  const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Hi! I just placed order ${shortId} on ${brand.name}`
  )}`

  return (
    <Html lang="en">
      <Head />
      <Preview>Order {shortId} confirmed — thank you for shopping with {brand.name}</Preview>
      <Body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: PAGE_BG,
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          color: BODY_TEXT,
        }}
      >
        <Container
          style={{
            maxWidth: 600,
            width: "100%",
            margin: "32px auto",
            backgroundColor: "#ffffff",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          {/* ── Navy header ── */}
          <Section
            style={{
              backgroundColor: NAVY,
              padding: "40px 32px 32px 32px",
              textAlign: "center",
              borderBottom: `1px solid ${DIVIDER_LIGHT}`,
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: "#ffffff",
                lineHeight: 1.1,
              }}
            >
              {brand.name}
            </Text>
            <Text
              style={{
                margin: "8px 0 0 0",
                fontSize: 10,
                letterSpacing: "0.3em",
                color: ACCENT,
                textTransform: "uppercase",
              }}
            >
              {brand.subtitle ?? ""}
            </Text>
          </Section>

          {/* ── Headline ── */}
          <Section style={{ padding: "40px 32px 8px 32px", textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontSize: 11,
                letterSpacing: "0.3em",
                color: MUTED_TEXT,
                textTransform: "uppercase",
              }}
            >
              Order Confirmed
            </Text>
            <Text
              style={{
                margin: "16px 0 0 0",
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 32,
                fontWeight: 500,
                letterSpacing: "0.02em",
                color: ACCENT,
                lineHeight: 1.2,
              }}
            >
              Order Confirmed! 🎉
            </Text>
            <Text
              style={{
                margin: "16px 0 0 0",
                fontSize: 16,
                lineHeight: 1.7,
                color: BODY_TEXT,
              }}
            >
              Thank you for shopping with{" "}
              <span style={{ color: NAVY, fontWeight: 500 }}>{brand.name}</span>.
            </Text>
          </Section>

          {/* ── Order ID pill ── */}
          <Section style={{ padding: "16px 32px 0 32px", textAlign: "center" }}>
            <Text
              style={{
                display: "inline-block",
                margin: 0,
                padding: "10px 20px",
                borderRadius: 9999,
                backgroundColor: `${ACCENT}18`,
                color: ACCENT,
                fontSize: 14,
                fontFamily: "'SFMono-Regular', Consolas, monospace",
                fontWeight: 500,
              }}
            >
              <span style={{ color: MUTED_TEXT, fontWeight: 400, marginRight: 6 }}>
                Order
              </span>
              #{shortId}
            </Text>
          </Section>

          {/* ── Customer + delivery ── */}
          <Section style={{ padding: "32px" }}>
            <Row>
              <Column style={{ verticalAlign: "top", paddingRight: 8 }}>
                <Text style={LABEL_STYLE}>Delivered To</Text>
                <Text style={{ ...VALUE_STYLE, fontWeight: 500 }}>
                  {order.customer_info.name}
                </Text>
                <Text style={VALUE_STYLE}>
                  {order.delivery_address.city}
                  <br />
                  {order.delivery_address.address}
                </Text>
                {order.delivery_address.notes && (
                  <Text style={{ ...VALUE_STYLE, color: MUTED_TEXT, fontSize: 12 }}>
                    {order.delivery_address.notes}
                  </Text>
                )}
              </Column>
              <Column style={{ verticalAlign: "top", paddingLeft: 8 }}>
                <Text style={LABEL_STYLE}>Contact</Text>
                <Text style={VALUE_STYLE}>{order.customer_info.phone}</Text>
                {order.customer_info.email && (
                  <Text style={{ ...VALUE_STYLE, color: MUTED_TEXT, fontSize: 13 }}>
                    {order.customer_info.email}
                  </Text>
                )}
              </Column>
            </Row>
          </Section>

          {/* ── Items table ── */}
          <Section
            style={{
              padding: "0 32px 8px 32px",
            }}
          >
            <Text style={LABEL_STYLE}>Your Items</Text>
            <table
              role="presentation"
              cellPadding={0}
              cellSpacing={0}
              width="100%"
              style={{
                borderCollapse: "collapse",
                marginTop: 12,
                border: `1px solid ${DIVIDER_DARK}`,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "rgba(61,20,25,0.04)" }}>
                  <th style={TH_STYLE}>Item</th>
                  <th style={{ ...TH_STYLE, textAlign: "center", width: 60 }}>Qty</th>
                  <th style={{ ...TH_STYLE, textAlign: "right", width: 120 }}>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => {
                  const variantLabel = item.variant
                    ? Object.entries(item.variant)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")
                    : null
                  return (
                    <tr
                      key={idx}
                      style={{
                        borderTop:
                          idx === 0 ? "none" : `1px solid ${DIVIDER_DARK}`,
                      }}
                    >
                      <td style={{ ...TD_STYLE, paddingTop: 12, paddingBottom: 12 }}>
                        <Text
                          style={{
                            margin: 0,
                            color: NAVY,
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            fontSize: 15,
                            fontWeight: 500,
                            lineHeight: 1.4,
                          }}
                        >
                          {item.name}
                        </Text>
                        {variantLabel && (
                          <Text
                            style={{
                              margin: "4px 0 0 0",
                              color: MUTED_TEXT,
                              fontSize: 12,
                            }}
                          >
                            {variantLabel}
                          </Text>
                        )}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          textAlign: "center",
                          color: BODY_TEXT,
                          paddingTop: 12,
                          paddingBottom: 12,
                        }}
                      >
                        ×{item.quantity}
                      </td>
                      <td
                        style={{
                          ...TD_STYLE,
                          textAlign: "right",
                          color: ACCENT,
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontWeight: 500,
                          paddingTop: 12,
                          paddingBottom: 12,
                        }}
                      >
                        {currency} {(item.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Section>

          {/* ── Totals ── */}
          <Section style={{ padding: "24px 32px 0 32px" }}>
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={TOTAL_LABEL}>Subtotal</td>
                  <td style={TOTAL_VALUE}>
                    {currency} {order.subtotal.toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td style={TOTAL_LABEL}>Delivery</td>
                  <td
                    style={{
                      ...TOTAL_VALUE,
                      color: order.delivery_fee === 0 ? "#16a34a" : NAVY,
                    }}
                  >
                    {order.delivery_fee === 0
                      ? "Free"
                      : `${currency} ${order.delivery_fee.toLocaleString()}`}
                  </td>
                </tr>
                {order.discount_amount > 0 && (
                  <tr>
                    <td style={{ ...TOTAL_LABEL, color: ACCENT }}>
                      Discount {order.promo_code ? `(${order.promo_code})` : ""}
                    </td>
                    <td style={{ ...TOTAL_VALUE, color: ACCENT }}>
                      − {currency} {order.discount_amount.toLocaleString()}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} style={{ paddingTop: 12 }}>
                    <Hr style={{ margin: 0, borderColor: DIVIDER_DARK }} />
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      ...TOTAL_LABEL,
                      paddingTop: 12,
                      fontSize: 16,
                      fontWeight: 600,
                      color: NAVY,
                    }}
                  >
                    Total
                  </td>
                  <td
                    style={{
                      ...TOTAL_VALUE,
                      paddingTop: 12,
                      fontSize: 18,
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontWeight: 500,
                      color: NAVY,
                    }}
                  >
                    {currency} {order.total.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* ── Confirmation copy ── */}
          <Section style={{ padding: "32px 32px 0 32px", textAlign: "center" }}>
            <Text
              style={{
                margin: 0,
                fontSize: 15,
                color: BODY_TEXT,
                lineHeight: 1.7,
              }}
            >
              We will contact you on{" "}
              <span style={{ color: NAVY, fontWeight: 500 }}>
                {order.customer_info.phone}
              </span>{" "}
              to confirm delivery.
            </Text>
          </Section>

          {/* ── WhatsApp CTA ── */}
          <Section style={{ padding: "24px 32px 8px 32px", textAlign: "center" }}>
            <Button
              href={waLink}
              style={{
                display: "inline-block",
                padding: "0 40px",
                height: 52,
                lineHeight: "52px",
                backgroundColor: "#25D366",
                color: "#ffffff",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 2,
              }}
            >
              Chat with us on WhatsApp
            </Button>
          </Section>

          {/* ── Navy footer ── */}
          <Section
            style={{
              backgroundColor: NAVY,
              padding: "32px",
              marginTop: 32,
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: "0.04em",
                color: ACCENT,
              }}
            >
              {brand.name}
            </Text>
            <Text
              style={{
                margin: "8px 0 0 0",
                fontSize: 12,
                color: TEXT_LIGHT,
                lineHeight: 1.7,
              }}
            >
              {brand.tagline}
            </Text>
            <Text
              style={{
                margin: "24px 0 0 0",
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
              }}
            >
              © {new Date().getFullYear()} {brand.name}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// ─── Reusable inline styles ────────────────────────────────────────────────

const LABEL_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 10,
  letterSpacing: "0.2em",
  color: MUTED_TEXT,
  textTransform: "uppercase",
  fontWeight: 600,
}

const VALUE_STYLE: React.CSSProperties = {
  margin: "8px 0 0 0",
  fontSize: 14,
  color: BODY_TEXT,
  lineHeight: 1.7,
}

const TH_STYLE: React.CSSProperties = {
  padding: "12px 12px",
  textAlign: "left",
  fontSize: 10,
  letterSpacing: "0.18em",
  color: NAVY,
  textTransform: "uppercase",
  fontWeight: 600,
}

const TD_STYLE: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: 14,
  verticalAlign: "top",
}

const TOTAL_LABEL: React.CSSProperties = {
  padding: "4px 0",
  fontSize: 14,
  color: BODY_TEXT,
  textAlign: "left",
}

const TOTAL_VALUE: React.CSSProperties = {
  padding: "4px 0",
  fontSize: 14,
  color: NAVY,
  textAlign: "right",
  fontWeight: 500,
}
