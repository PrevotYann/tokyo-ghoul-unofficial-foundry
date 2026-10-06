/** Enrich stored HTML for display, respecting document links and secret visibility. */
export async function enrichSheetFields(document, fields) {
  const entries = await Promise.all(fields.map(async field => [field,
    await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      foundry.utils.getProperty(document.system, field) ?? "",
      { relativeTo: document, secrets: document.isOwner }
    )
  ]));
  return Object.fromEntries(entries);
}

/** Give the native pencil control a localized accessible name. */
export function labelRichTextEditors(element) {
  for (const button of element.querySelectorAll(".tg-rich-text > button.toggle")) {
    const label = game.i18n.localize("TG.sheet.editText");
    button.title = label;
    button.setAttribute("aria-label", label);
  }
}
