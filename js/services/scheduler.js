const timers = {};
let isVisible = true;

document.addEventListener('visibilitychange', () => {
  isVisible = !document.hidden;
  if (isVisible) {
    Object.values(timers).forEach(t => {
      if (t.paused) {
        t.paused = false;
        t.callback();
        t.id = setInterval(t.callback, t.interval);
      }
    });
  } else {
    Object.values(timers).forEach(t => {
      clearInterval(t.id);
      t.paused = true;
    });
  }
});

export function startScheduler(config) {
  Object.entries(config).forEach(([name, { interval, callback }]) => {
    timers[name] = {
      interval,
      callback,
      paused: false,
      id: setInterval(callback, interval),
    };
  });
}

export function stopScheduler() {
  Object.values(timers).forEach(t => clearInterval(t.id));
}
