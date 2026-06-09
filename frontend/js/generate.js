/**
 * generate.js — Generate View Logic
 * Handles form submission, AI response display with typing effect,
 * copy/download/regenerate actions, and star rating submission.
 */

// ── State ─────────────────────────────────────────────────
let currentGenerationId = null;
let lastFormData = null;
let selectedRating = 0;
let ratingSubmitted = false;

// ── Shared Utilities ──────────────────────────────────────

/** Show toast notification */
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.className = `toast ${type} show`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
  setTimeout(() => { toast.classList.remove('show'); }, 3500);
}

/** Convert markdown-like AI response to HTML */
function markdownToHtml(text) {
  return text
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
    .replace(/<p><(h[123])>/g, '<$1>')
    .replace(/<\/(h[123])><\/p>/g, '</$1>');
}

/** Type-writer animation effect for the narrative output */
async function typewriterDisplay(html, container) {
  // Parse HTML to plain text segments, then type them in
  const div = document.createElement('div');
  div.className = 'narrative-body';
  div.innerHTML = html;
  container.innerHTML = '';

  // Add cursor
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  container.appendChild(cursor);

  // Collect text nodes recursively
  const allText = div.innerHTML;
  let i = 0;
  const chunkSize = 4; // characters per frame

  return new Promise((resolve) => {
    function typeChunk() {
      if (i >= allText.length) {
        cursor.remove();
        container.innerHTML = allText;
        container.firstElementChild?.classList.add('narrative-body');
        resolve();
        return;
      }
      i = Math.min(i + chunkSize, allText.length);
      // Show partial content + cursor
      const partial = document.createElement('div');
      partial.className = 'narrative-body';
      partial.innerHTML = allText.slice(0, i);
      container.innerHTML = '';
      container.appendChild(partial);
      container.appendChild(cursor);
      requestAnimationFrame(typeChunk);
    }
    requestAnimationFrame(typeChunk);
  });
}

// ── Form Submission ───────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const form         = document.getElementById('narrativeForm');
  const generateBtn  = document.getElementById('generateBtn');
  const btnText      = generateBtn.querySelector('.btn-text');
  const btnLoader    = document.getElementById('generateLoader');
  const outputSec    = document.getElementById('outputSection');
  const outputContent = document.getElementById('outputContent');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const driverName  = document.getElementById('driverName').value.trim();
    const route       = document.getElementById('route').value.trim();

    if (!driverName || !route) {
      showToast('Driver name and route are required.', 'error');
      return;
    }

    // Collect form data
    lastFormData = {
      driverName,
      route,
      landmarks:   document.getElementById('landmarks').value.trim(),
      highlights:  document.getElementById('highlights').value.trim(),
      tripDate:    document.getElementById('tripDate').value,
      vehicleType: document.getElementById('vehicleType').value,
      tone:        document.getElementById('tone').value,
    };

    await generateNarrative(lastFormData, generateBtn, btnText, btnLoader, outputSec, outputContent);
  });

  // Regenerate button
  document.getElementById('regenerateBtn').addEventListener('click', async () => {
    if (!lastFormData) return;
    const generateBtn  = document.getElementById('generateBtn');
    const btnText      = generateBtn.querySelector('.btn-text');
    const btnLoader    = document.getElementById('generateLoader');
    const outputSec    = document.getElementById('outputSection');
    const outputContent = document.getElementById('outputContent');
    await generateNarrative(lastFormData, generateBtn, btnText, btnLoader, outputSec, outputContent);
  });

  // Copy button
  document.getElementById('copyBtn').addEventListener('click', () => {
    const text = document.getElementById('outputContent').innerText;
    navigator.clipboard.writeText(text).then(() => {
      showToast('Narrative copied to clipboard!', 'success');
    });
  });

  // Download button
  document.getElementById('downloadBtn').addEventListener('click', () => {
    const text = document.getElementById('outputContent').innerText;
    const filename = `manivtha_narrative_${new Date().toISOString().slice(0, 10)}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded successfully!', 'success');
  });

  // Star rating
  initStarRating();
});

async function generateNarrative(data, btn, btnText, btnLoader, outputSec, outputContent) {
  // UI: loading state
  btn.disabled = true;
  btnText.textContent = 'Generating…';
  btnLoader.style.display = 'flex';
  outputSec.style.display = 'none';
  resetRating();
  ratingSubmitted = false;
  currentGenerationId = null;

  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Generation failed');
    }

    currentGenerationId = json.id;

    // Show output section
    outputSec.style.display = 'block';
    outputSec.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Typing effect
    const html = markdownToHtml(json.narrative);
    await typewriterDisplay(html, outputContent);

    showToast('Narrative generated successfully! ✨', 'success');

  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
    console.error(err);
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Generate Narrative';
    btnLoader.style.display = 'none';
  }
}

// ── Star Rating ────────────────────────────────────────────
function initStarRating() {
  const stars = document.querySelectorAll('.star');
  const submitBtn = document.getElementById('submitRatingBtn');

  stars.forEach((star) => {
    star.addEventListener('mouseover', () => highlightStars(Number(star.dataset.value)));
    star.addEventListener('mouseleave', () => highlightStars(selectedRating));
    star.addEventListener('click', () => {
      selectedRating = Number(star.dataset.value);
      highlightStars(selectedRating);
      submitBtn.style.display = 'inline-flex';
    });
    // Keyboard support
    star.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        selectedRating = Number(star.dataset.value);
        highlightStars(selectedRating);
        submitBtn.style.display = 'inline-flex';
      }
    });
  });

  submitBtn.addEventListener('click', async () => {
    if (!currentGenerationId || !selectedRating) return;
    if (ratingSubmitted) { showToast('Already rated!', 'info'); return; }

    const comment = document.getElementById('ratingComment').value.trim();

    try {
      const res = await fetch(`${API_BASE}/feedback/${currentGenerationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: selectedRating, comment }),
      });
      if (!res.ok) throw new Error('Rating submission failed');
      ratingSubmitted = true;
      submitBtn.textContent = '✅ Rating Saved!';
      submitBtn.disabled = true;
      showToast(`Rated ${selectedRating} star${selectedRating > 1 ? 's' : ''}. Thank you!`, 'success');
    } catch (err) {
      showToast('Failed to save rating. Try again.', 'error');
    }
  });
}

function highlightStars(count) {
  document.querySelectorAll('.star').forEach((s) => {
    s.classList.toggle('active', Number(s.dataset.value) <= count);
  });
}

function resetRating() {
  selectedRating = 0;
  highlightStars(0);
  document.getElementById('ratingComment').value = '';
  const btn = document.getElementById('submitRatingBtn');
  btn.style.display = 'none';
  btn.disabled = false;
  btn.textContent = 'Submit Rating';
}
