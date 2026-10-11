const form = document.querySelector("#search-form");
const input = document.querySelector("#animal-input");
const resultSection = document.querySelector("#result-section");
const resultContent = document.querySelector("#result-content");

function showMessage(message, type = "") {
  resultSection.hidden = false;
  resultContent.replaceChildren();
  const element = document.createElement("div");
  element.className = `status-message ${type}`.trim();
  element.textContent = message;
  resultContent.append(element);
}

function renderAnimal(animal) {
  resultSection.hidden = false;
  const card = document.createElement("article");
  card.className = "result-card";

  const body = document.createElement("div");
  body.className = "result-body";
  const eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = "YOUR ANIMAL FACT FILE";
  const title = document.createElement("h2");
  title.textContent = animal.title;
  const description = document.createElement("p");
  description.className = "result-description";
  description.textContent = animal.description;
  const facts = document.createElement("dl");
  facts.className = "fact-list";
  for (const fact of animal.facts || []) {
    const item = document.createElement("div");
    item.className = "fact-item";
    const label = document.createElement("dt");
    label.textContent = fact.label;
    const value = document.createElement("dd");
    value.textContent = fact.value;
    item.append(label, value);
    facts.append(item);
  }
  const source = document.createElement("a");
  source.className = "source-link";
  source.href = animal.articleUrl;
  source.target = "_blank";
  source.rel = "noopener noreferrer";
  source.textContent = "Animal facts by API Ninjas ↗";

  body.append(eyebrow, title, description, facts, source);
  card.append(body);
  resultContent.replaceChildren(card);
}

async function searchAnimal(name) {
  input.value = name;
  resultSection.setAttribute("aria-busy", "true");
  showMessage("Looking up fascinating animal facts…", "loading");

  try {
    const response = await fetch(`/api/animal?q=${encodeURIComponent(name)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "The search could not be completed. Please try again.");
    }
    renderAnimal(data);
  } catch (error) {
    showMessage(error.message || "Something went wrong. Please try again in a moment.", "error");
  } finally {
    resultSection.setAttribute("aria-busy", "false");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = input.value.trim();
  if (name) searchAnimal(name);
});

document.querySelectorAll(".suggestion-chip").forEach((button) => {
  button.addEventListener("click", () => searchAnimal(button.dataset.query || button.dataset.animal));
});
