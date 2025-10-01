// api/verify.js
import dns from "dns/promises";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let { emails } = req.body;
  if (!Array.isArray(emails)) {
    return res.status(400).json({ error: "Invalid input" });
  }

  // Remove duplicates + lowercase
  emails = [...new Set(emails.map(e => e.toLowerCase()))];

  // Filters
  const google = /(gmail|google|gsuite|googlemail)/i;
  const microsoft = /(microsoft|office365|outlook|hotmail|live\.com|msn\.com)/i;

  function isBad(domain) {
    return google.test(domain) || microsoft.test(domain);
  }

  let filtered = emails.filter(e => {
    let d = e.split("@")[1];
    return d && !isBad(d);
  });

  let verified = [];
  for (let e of filtered) {
    let d = e.split("@")[1];
    try {
      let mx = await dns.resolveMx(d);
      if (mx && mx.length > 0) {
        verified.push(e);
      }
    } catch {
      // no MX, skip
    }
  }

  res.status(200).json({
    total: emails.length,
    filteredCount: filtered.length,
    verified
  });
}
