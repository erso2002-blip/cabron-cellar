type SendLoginCodeInput = {
  email: string;
  code: string;
};

function fromAddress() {
  return process.env.AUTH_EMAIL_FROM ?? "MyCellar <no-reply@mycellar.com.br>";
}

export function isEmailLoginDeliveryConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendLoginCodeEmail({ email, code }: SendLoginCodeInput) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Email delivery is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: email,
      subject: "Seu código de acesso MyCellar",
      text: [
        "Seu código de acesso ao MyCellar:",
        "",
        code,
        "",
        "Ele expira em 10 minutos. Se você não pediu este código, ignore este e-mail.",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;color:#1f1f1f;line-height:1.5">
          <p>Seu código de acesso ao MyCellar:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
          <p>Ele expira em 10 minutos. Se você não pediu este código, ignore este e-mail.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    throw new Error("Email delivery failed");
  }
}
