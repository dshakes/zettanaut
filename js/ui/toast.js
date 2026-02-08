const container = () => document.getElementById('toastContainer');

export function showToast(message, type = 'info', duration = 4000) {
  const el = document.createElement('div');
  el.className = `toast ${type !== 'info' ? `toast--${type}` : ''}`;

  const icon = type === 'error' ? 'error_outline' : type === 'success' ? 'check_circle' : 'info';
  el.innerHTML = `<span class="material-icons-outlined">${icon}</span>${escapeHTML(message)}`;

  container().appendChild(el);

  setTimeout(() => {
    el.classList.add('toast-out');
    el.addEventListener('animationend', () => el.remove());
  }, duration);
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
