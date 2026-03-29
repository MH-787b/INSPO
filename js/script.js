(function () {
  'use strict';

  const form = document.getElementById('inspo-form');
  const messageEl = document.getElementById('message');
  const btn = form.querySelector('.btn');
  const btnText = 'Send me inspiration';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = form.email.value.trim();
    if (!email) return;

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span>Generating...';
    messageEl.textContent = '';
    messageEl.className = 'message';

    try {
      const res = await fetch('/api/send-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        messageEl.textContent = 'Check your inbox — your AI inspiration is on its way!';
        messageEl.className = 'message success';
        form.reset();
      } else {
        messageEl.textContent = data.error || 'Something went wrong. Try again.';
        messageEl.className = 'message error';
      }
    } catch {
      messageEl.textContent = 'Network error. Please try again.';
      messageEl.className = 'message error';
    }

    btn.disabled = false;
    btn.textContent = btnText;
  });
})();
