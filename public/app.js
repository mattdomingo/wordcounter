const textInput = document.querySelector('#text-input');
const wordCount = document.querySelector('#word-count');
const characterCount = document.querySelector('#character-count');
const status = document.querySelector('#request-status');
const errorMessage = document.querySelector('#error-message');

let debounceTimer;
let activeRequest;

function setError(message = '') {
  errorMessage.textContent = message;
  errorMessage.hidden = !message;
}

function showCounts({ words, characters }) {
  wordCount.textContent = words.toLocaleString();
  characterCount.textContent = characters.toLocaleString();
}

async function requestCount(text) {
  if (activeRequest) activeRequest.abort();
  activeRequest = new AbortController();
  status.textContent = 'Updating…';
  setError();

  try {
    const response = await fetch('/api/word-count', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: activeRequest.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || 'Unable to count this text. Please try again.');
    showCounts(body);
    status.textContent = '';
  } catch (error) {
    if (error.name === 'AbortError') return;
    status.textContent = '';
    setError(error.message);
  }
}

textInput.addEventListener('input', () => {
  window.clearTimeout(debounceTimer);
  const text = textInput.value;

  if (!text.trim()) {
    if (activeRequest) activeRequest.abort();
    wordCount.textContent = '—';
    characterCount.textContent = '—';
    status.textContent = '';
    setError();
    return;
  }

  debounceTimer = window.setTimeout(() => requestCount(text), 250);
});
