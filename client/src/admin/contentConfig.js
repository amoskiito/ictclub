// Describes the simple content types managed in the admin dashboard.
// To add a field, add it here AND in server/routes/content.js.
export const CONTENT = {
  news: {
    label: "News posts", singular: "post",
    fields: [
      { key: "title", label: "Title", type: "text", required: true, span: 2 },
      { key: "category", label: "Category", type: "text", placeholder: "e.g. Announcement" },
      { key: "excerpt", label: "Short summary", type: "textarea", rows: 2, span: 2 },
      { key: "body", label: "Body", type: "textarea", rows: 10, required: true, span: 2, help: "Separate paragraphs with a blank line." },
      { key: "published", label: "Published (visible to everyone)", type: "checkbox", default: true }
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "category", label: "Category" },
      { key: "published", label: "Status", render: (v) => (v === false ? "Draft" : "Published") },
      { key: "createdAt", label: "Date", date: true }
    ]
  },
  resources: {
    label: "Resources", singular: "resource",
    fields: [
      { key: "title", label: "Title", type: "text", required: true },
      { key: "kind", label: "Type", type: "select", options: ["doc", "link", "newsletter", "form"] },
      { key: "url", label: "Link", type: "url", required: true, placeholder: "https://", span: 2 },
      { key: "description", label: "Description", type: "textarea", rows: 2, span: 2 }
    ],
    columns: [
      { key: "title", label: "Title" },
      { key: "kind", label: "Type" },
      { key: "url", label: "Link" }
    ]
  },
  albums: {
    label: "Gallery albums", singular: "album",
    fields: [
      { key: "title", label: "Album title", type: "text", required: true },
      { key: "coverEmoji", label: "Cover emoji (used when there are no photos)", type: "text" },
      { key: "description", label: "Description", type: "textarea", rows: 2, span: 2 },
      {
        key: "images", label: "Photos", type: "images", span: 2,
        help: "One photo per line: the picture link, then a | and an optional caption. Example: https://example.com/team.jpg | Team photo"
      }
    ],
    columns: [
      { key: "title", label: "Album" },
      { key: "images", label: "Photos", render: (v) => (v || []).length }
    ]
  },
  leaders: {
    label: "Leadership", singular: "leader",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "position", label: "Position", type: "text", required: true, placeholder: "e.g. President" },
      { key: "bio", label: "Short bio", type: "textarea", rows: 3, span: 2 },
      { key: "photoUrl", label: "Photo link", type: "url", placeholder: "https://" },
      { key: "order", label: "Order on page (1 = first)", type: "number", default: 100 },
      { key: "linkedin", label: "LinkedIn link", type: "url", placeholder: "https://" },
      { key: "github", label: "GitHub link", type: "url", placeholder: "https://" }
    ],
    columns: [
      { key: "order", label: "#" },
      { key: "name", label: "Name" },
      { key: "position", label: "Position" }
    ]
  },
  sponsors: {
    label: "Sponsors and partners", singular: "sponsor",
    fields: [
      { key: "name", label: "Name", type: "text", required: true },
      { key: "tier", label: "Tier", type: "select", options: ["Gold", "Silver", "Bronze", "Partner"] },
      { key: "url", label: "Website", type: "url", placeholder: "https://" },
      { key: "logoUrl", label: "Logo link", type: "url", placeholder: "https://" },
      { key: "blurb", label: "Short description", type: "textarea", rows: 2, span: 2 }
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "tier", label: "Tier" },
      { key: "url", label: "Website" }
    ]
  }
};

export function blankValues(config) {
  const v = {};
  config.fields.forEach((f) => {
    if (f.type === "checkbox") v[f.key] = f.default ?? false;
    else if (f.type === "select") v[f.key] = f.options[0];
    else if (f.type === "number") v[f.key] = f.default ?? 0;
    else v[f.key] = "";
  });
  return v;
}

export function toFormValues(config, item) {
  const v = blankValues(config);
  config.fields.forEach((f) => {
    if (item[f.key] === undefined || item[f.key] === null) return;
    v[f.key] = f.type === "images"
      ? item[f.key].map((i) => (i.caption ? `${i.url} | ${i.caption}` : i.url)).join("\n")
      : item[f.key];
  });
  return v;
}

export function fromFormValues(config, values) {
  const body = { ...values };
  config.fields.forEach((f) => {
    if (f.type === "images") {
      body[f.key] = String(values[f.key] || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [url, ...rest] = line.split("|");
          return { url: url.trim(), caption: rest.join("|").trim() };
        });
    }
    if (f.type === "number") body[f.key] = Number(values[f.key]) || 0;
  });
  return body;
}
