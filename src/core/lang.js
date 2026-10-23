// Tiny bilingual helper: L('中文', 'English') returns the string for the active language.
let current = 'zh';
export const setLang = (l) => { current = l; };
export const getLang = () => current;
export const L = (zh, en) => (current === 'en' && en != null ? en : zh);
