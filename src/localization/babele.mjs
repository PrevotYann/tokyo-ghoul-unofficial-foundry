/** Optional Babele integration. Its bootstrap hook runs before translation sources load. */
export function registerBabeleHooks(hooks = Hooks) {
  hooks.once("babele.init", babele => babele.setSystemTranslationsDir("babele"));
}
