import { ACTION_ICONS, ITEM_ICONS } from "./sheet-view.mjs";

export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("tgLocalize", (key) => game.i18n.localize(key));
  Handlebars.registerHelper("tgJson", (value) => JSON.stringify(value, null, 2));
  // Variadic like Foundry's core helpers, so core templates keep working.
  Handlebars.registerHelper("or", (...args) => args.slice(0, -1).some(Boolean));
  Handlebars.registerHelper("and", (...args) => args.slice(0, -1).every(Boolean));
  Handlebars.registerHelper("eq", (left, right) => left === right);
  Handlebars.registerHelper("tgGt", (left, right) => Number(left) > Number(right));
  Handlebars.registerHelper("concat", (...parts) => parts.slice(0, -1).join(""));
  Handlebars.registerHelper("tgIcon", (action) => ACTION_ICONS[action] ?? "fa-circle-dot");
  Handlebars.registerHelper("tgItemIcon", (type) => ITEM_ICONS[type] ?? "fa-cube");
}
