/* ============================================
   SFACCIMMOPOLY — LOGIN
   Handles the login form on index.html
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  i18n.init();   // ← tutto in uno: lingua, bottoni, traduzioni

  const form     = document.getElementById('login-form');
  const input    = document.getElementById('password-input');
  const errorMsg = document.getElementById('login-error');

  if (Auth.isAuthenticated()) {
    window.location.href = './lobby.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();   // ← blocca il reload
    errorMsg.classList.add('hidden');

    try {
      await Auth.login(input.value);
      window.location.href = './lobby.html';
    } catch {
      errorMsg.classList.remove('hidden');
      input.value = '';
      input.focus();
    }
  });
});
