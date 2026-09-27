const wordInput = document.querySelector('#word');
const result = document.querySelector('#result');
const lookupButton = document.querySelector('#lookup');
const cacheKey = 'german-article-cache-v2';
const cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');

function cleanWord(value) { return value.normalize('NFC').trim().replace(/[„“”‚‘’.,!?;:()[\]{}"«»]/g, ''); }
function escapeHTML(value) { const div = document.createElement('div'); div.textContent = value ?? ''; return div.innerHTML; }
function saveCache() { localStorage.setItem(cacheKey, JSON.stringify(cache)); }

function findGender(wikitext) {
  const match = wikitext.match(/Genus\s*=\s*([mfn])/i) || wikitext.match(/Wortart\|Substantiv\|Deutsch[^\n]*?\}\s*,\s*\{\{([mfn])\}\}/i);
  return match ? ({m:['der','Maskulinum'],f:['die','Femininum'],n:['das','Neutrum']}[match[1].toLowerCase()]) : null;
}
function findTranslations(wikitext) {
  const values = [], regex = /\{\{(?:Ü|Üt|Üxx4|L)\|en\|([^}|\n]+)/gi; let match;
  while ((match = regex.exec(wikitext)) && values.length < 10) { const value = match[1].trim(); if (value && !values.includes(value)) values.push(value); }
  return values;
}
function field(text, name) {
  const match = text.match(new RegExp('^\\|' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^\\n]*)', 'mi'));
  return match ? match[1].trim() : '';
}
function findDeclension(wikitext, word) {
  const labels = [['Nominativ Singular','Nominative','singular'],['Genitiv Singular','Genitive','singular'],['Dativ Singular','Dative','singular'],['Akkusativ Singular','Accusative','singular'],['Nominativ Plural','Nominative','plural'],['Genitiv Plural','Genitive','plural'],['Dativ Plural','Dative','plural'],['Akkusativ Plural','Accusative','plural']];
  const rows = labels.map(([key,casus,number]) => [casus,number,field(wikitext,key)]).filter(row => row[2]);
  return rows.length ? rows : [['Nominative','singular',word]];
}
async function fetchWord(word) {
  const url = `https://de.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(word)}&prop=wikitext&format=json&origin=*`;
  const response = await fetch(url, {headers:{Accept:'application/json'}});
  if (!response.ok) throw new Error(`Dictionary request failed (${response.status})`);
  const data = await response.json(); const text = data?.parse?.wikitext?.['*'];
  if (!text) throw new Error('Word not found');
  return {word, gender:findGender(text), translations:findTranslations(text), declension:findDeclension(text,word), url:`https://de.wiktionary.org/wiki/${encodeURIComponent(word)}`};
}
function render(data) {
  const article = data.gender ? `${data.gender[0]} ${escapeHTML(data.word)}` : escapeHTML(data.word);
  const gender = data.gender ? data.gender[1] : 'Noun';
  const meanings = data.translations.length ? data.translations.map(escapeHTML).join(', ') : 'No English translation found';
  const rows = data.declension.map(([casus,number,value]) => `<tr><td>${casus}</td><td>${number}</td><td>${escapeHTML(value)}</td></tr>`).join('');
  result.innerHTML = `<h2>${article}</h2><p class="word-type">Substantiv · ${gender}</p><p class="meaning-label">ENGLISH</p><p class="meaning">${meanings}</p><table class="declension"><thead><tr><th>CASE</th><th>NUMBER</th><th>FORM</th></tr></thead><tbody>${rows}</tbody></table><p class="note"><a href="${data.url}" target="_blank" rel="noreferrer">Open full dictionary entry ↗</a></p>`;
}
async function lookup(raw) {
  const word = cleanWord(raw); if (!word) return;
  wordInput.value = word; result.hidden = false; result.innerHTML = '<p class="loading">Looking up…</p>'; lookupButton.disabled = true;
  try { const data = cache[word] || await fetchWord(word); cache[word] = data; saveCache(); render(data); }
  catch (error) { result.innerHTML = `<p class="error">${escapeHTML(error.message)}. Check the spelling or open the dictionary directly.</p>`; }
  finally { lookupButton.disabled = false; }
}
lookupButton.addEventListener('click', () => lookup(wordInput.value));
wordInput.addEventListener('keydown', event => { if (event.key === 'Enter') lookup(wordInput.value); });
document.querySelector('#installHelp').addEventListener('click', () => document.querySelector('#installDialog').showModal());
document.querySelector('#closeDialog').addEventListener('click', () => document.querySelector('#installDialog').close());
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
