/**
 * readAloud.js — Read-aloud button using Web Speech API.
 */

/**
 * Create a read-aloud button for a given text source.
 * @param {function} getText - Returns the text to read aloud.
 * @returns {HTMLElement}
 */
export function createReadAloudBtn(getText) {
  const btn = document.createElement('button');
  btn.className = 'btn btn-secondary btn-sm';
  btn.setAttribute('aria-label', 'Read this aloud');
  btn.textContent = '🔊 Read Aloud';

  let speaking = false;

  btn.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      alert('Read aloud is not supported in your browser.');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      btn.textContent = '🔊 Read Aloud';
      speaking = false;
      return;
    }

    const text = getText();
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      speaking = true;
      btn.textContent = '⏹ Stop';
    };
    utterance.onend = utterance.onerror = () => {
      speaking = false;
      btn.textContent = '🔊 Read Aloud';
    };

    window.speechSynthesis.speak(utterance);
  });

  return btn;
}

/**
 * Stop any ongoing speech synthesis.
 */
export function stopReadAloud() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

