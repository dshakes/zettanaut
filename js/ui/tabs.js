export function initTabs() {
  const tabBar = document.getElementById('tabBar');
  const tabs = tabBar.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.panel');

  function activate(tabName) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
    panels.forEach(p => p.classList.toggle('active', p.id === `panel-${tabName}`));
  }

  tabBar.addEventListener('click', (e) => {
    const tab = e.target.closest('.nav-item');
    if (!tab) return;
    const name = tab.dataset.tab;
    activate(name);
    history.replaceState(null, '', `#${name}`);
  });

  // Restore from hash
  const hash = location.hash.slice(1);
  if (['latest', 'news', 'releases', 'papers', 'resources', 'podcasts', 'ai-engineer', 'ai-atlas', 'archive', 'saved'].includes(hash)) {
    activate(hash);
  }
}

export function activateTab(name) {
  const tabBar = document.getElementById('tabBar');
  if (!tabBar) return;
  tabBar.querySelectorAll('.nav-item').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === `panel-${name}`));
  history.replaceState(null, '', `#${name}`);
}
