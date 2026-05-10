export function registerHandlebarsHelpers() {
  Handlebars.registerHelper("tgLocalize", (key) => game.i18n.localize(key));
  Handlebars.registerHelper("tgJson", (value) => JSON.stringify(value, null, 2));
  Handlebars.registerHelper("eq", (left, right) => left === right);
  Handlebars.registerHelper("concat", (...parts) => parts.slice(0, -1).join(""));
}
