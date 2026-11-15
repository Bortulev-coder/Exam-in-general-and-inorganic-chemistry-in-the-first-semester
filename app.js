"use strict";

const storageKey = "bortulev-chemistry-progress-v1";

function getProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch {
    return new Set();
  }
}

function normalize(value) {
  return value.normalize("NFKC").toLowerCase().replaceAll("ё", "е").replace(/[−–—]/g, "-");
}

const input = document.querySelector("#search");
const complete = document.querySelector("#complete");

if (input) {
  const results = document.querySelector("#catalog-count");
  const empty = document.querySelector("#empty");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const practiceButton = document.querySelector("#practice-mode");
  const topics = [...document.querySelectorAll("[data-topic]")].map((card) => ({
    card,
    text: normalize(card.dataset.search),
    href: card.getAttribute("href"),
  }));
  let group = "all";
  let practice = false;

  function render() {
    const tokens = normalize(input.value.trim()).split(/\s+/).filter(Boolean);
    const finished = getProgress();
    let visible = 0;

    for (const topic of topics) {
      const { card, text, href } = topic;
      const matchesGroup = group === "all" || group === card.dataset.group;
      const matchesQuery = tokens.every((token) => text.includes(token));
      const done = finished.has(card.dataset.topic);
      card.hidden = !matchesGroup || !matchesQuery;
      card.href = practice ? href + "#practice" : href;
      card.classList.toggle("done", done);
      const arrow = card.querySelector(".arrow");
      arrow.textContent = done ? "✓" : "↗";
      arrow.title = done ? "Тема изучена" : "";
      if (!card.hidden) visible++;
    }

    results.textContent = "Темы " + visible + " из " + topics.length + " · Изучено " +
      topics.filter(({card}) => finished.has(card.dataset.topic)).length;
    empty.hidden = visible > 0;
  }

  for (const filter of filters) {
    filter.addEventListener("click", () => {
      group = filter.dataset.filter;
      for (const item of filters) item.setAttribute("aria-pressed", String(item === filter));
      render();
    });
  }

  practiceButton.addEventListener("click", () => {
    practice = !practice;
    practiceButton.setAttribute("aria-pressed", String(practice));
    render();
  });
  input.addEventListener("input", render);
  window.addEventListener("pageshow", render);
  document.querySelectorAll("[data-app-controls]").forEach((item) => { item.hidden = false; });
  render();
}

if (complete) {
  const slug = document.body.dataset.lesson;
  let finished = getProgress();

  function renderComplete() {
    const done = finished.has(slug);
    complete.setAttribute("aria-pressed", String(done));
    complete.textContent = done ? "✓ Тема изучена" : "Отметить тему изученной";
  }

  complete.addEventListener("click", () => {
    if (finished.has(slug)) finished.delete(slug);
    else finished.add(slug);
    try {
      localStorage.setItem(storageKey, JSON.stringify([...finished]));
    } catch {
      // The control remains usable within the current page if storage is disabled.
    }
    renderComplete();
  });
  window.addEventListener("pageshow", () => {
    finished = getProgress();
    renderComplete();
  });
  complete.hidden = false;
  renderComplete();
}
