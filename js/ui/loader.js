function createSkeletonCard() {
  const el = document.createElement('div');
  el.className = 'skeleton-card skeleton';
  el.innerHTML = `
    <div class="skeleton-line skeleton-line--badge"></div>
    <div class="skeleton-line skeleton-line--title"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line skeleton-line--short"></div>
    <div class="skeleton-line skeleton-line--meta"></div>
  `;
  return el;
}

export function showLoader(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    grid.appendChild(createSkeletonCard());
  }
}

export function hideLoader(gridId) {
  const grid = document.getElementById(gridId);
  if (!grid) return;
  grid.querySelectorAll('.skeleton-card').forEach(el => el.remove());
}

export function showPodcastLoader(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 4; i++) {
    const row = document.createElement('div');
    row.className = 'skeleton-card skeleton';
    row.innerHTML = `
      <div class="skeleton-line skeleton-line--badge" style="width:80px"></div>
      <div class="skeleton-line skeleton-line--title"></div>
      <div class="skeleton-line skeleton-line--short"></div>
    `;
    container.appendChild(row);
  }
}
