
window.DogProfileToggles = {
  set(group, value) {
    document.querySelectorAll(`[data-toggle-group='${group}'] .toggle`)
      .forEach(t => t.classList.toggle('active', t.dataset.value === value));
    localStorage.setItem(`dog.${group}`, value);
  },
  load(group) {
    return localStorage.getItem(`dog.${group}`);
  }
};
