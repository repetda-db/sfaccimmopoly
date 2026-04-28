/* ============================================
   SFACCIMMOPOLY — LOGIN
   Handles the login form on index.html
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Apply translations
  i18n.applyToDOM();

  // Elements
  const form     = document.getElementById('login-form');
  const input    = document.getElementById('password-input');
  const errorMsg = document.getElementById('login-error');

  // Lang buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      i18n.setLang(btn.dataset.lang);
    });
  });

  // If already authenticated, skip login
  if (Auth.isAuthenticated()) {
    window.location.href = 'game.html';
    return;
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.classList.add('hidden');

    try {
      await Auth.login(input.value);
      window.location.href = 'game.html';
    } catch {
      errorMsg.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  });
});
