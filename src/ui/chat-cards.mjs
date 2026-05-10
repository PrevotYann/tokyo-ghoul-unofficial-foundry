export function registerChatCardListeners() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-tg-chat-action]");
    if (!button) return;
    event.preventDefault();
    ui.notifications?.info(game.i18n.localize("TG.chat.notImplemented"));
  });
}
