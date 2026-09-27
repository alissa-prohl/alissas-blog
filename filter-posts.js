// Filter & Suche für die Kategorieseiten (Abenteuer, Projekte, Musik)
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("filter-toggle-btn");
  const toggleIcon = document.getElementById("filter-toggle-icon");
  const filterPanel = document.getElementById("filter-panel");
  const searchInput = document.getElementById("filter-search-input");
  const clearSearchBtn = document.getElementById("filter-search-clear");
  const yearSelect = document.getElementById("filter-year-select");
  const monthSelect = document.getElementById("filter-month-select");
  const resetBtn = document.getElementById("filter-reset-btn");
  const countEl = document.getElementById("filter-count");
  const emptyState = document.getElementById("filter-empty-state");
  const resetEmptyBtn = document.getElementById("filter-reset-empty-btn");
  const postsList = document.getElementById("posts-list");
  const activeBadge = document.getElementById("filter-active-badge");

  if (!postsList) return;

  const cards = Array.from(postsList.querySelectorAll("a[href*='posts/']"));
  if (cards.length === 0) {
    if (toggleBtn) toggleBtn.style.display = "none";
    return;
  }

  // Deutsche Monatsnamen
  const MONTH_NAMES = [
    { num: 1, name: "Januar" },
    { num: 2, name: "Februar" },
    { num: 3, name: "März" },
    { num: 4, name: "April" },
    { num: 5, name: "Mai" },
    { num: 6, name: "Juni" },
    { num: 7, name: "Juli" },
    { num: 8, name: "August" },
    { num: 9, name: "September" },
    { num: 10, name: "Oktober" },
    { num: 11, name: "November" },
    { num: 12, name: "Dezember" },
  ];

  // 1. Jahre dynamisch aus den vorhandenen Beiträgen sammeln
  const years = new Set();
  cards.forEach((card) => {
    let year = card.getAttribute("data-year");
    if (!year) {
      const dateText = card.querySelector("span")?.textContent || "";
      const match = dateText.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (match) {
        year = match[3];
        card.setAttribute("data-year", year);
        card.setAttribute("data-month", parseInt(match[2], 10).toString());
      }
    }
    if (year) years.add(year);
  });

  const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
  if (yearSelect && sortedYears.length > 0) {
    sortedYears.forEach((yr) => {
      const opt = document.createElement("option");
      opt.value = yr;
      opt.textContent = `Jahr: ${yr}`;
      yearSelect.appendChild(opt);
    });
  }

  // 2. Monate in Dropdown befüllen
  if (monthSelect) {
    MONTH_NAMES.forEach(({ num, name }) => {
      const opt = document.createElement("option");
      opt.value = num.toString();
      opt.textContent = name;
      monthSelect.appendChild(opt);
    });
  }

  // 3. Ausklapp-Logik
  let isOpen = false;
  if (toggleBtn && filterPanel) {
    toggleBtn.addEventListener("click", () => {
      isOpen = !isOpen;
      if (isOpen) {
        filterPanel.classList.remove("hidden");
        filterPanel.classList.add("flex");
        if (toggleIcon) toggleIcon.classList.add("rotate-180");
        toggleBtn.setAttribute("aria-expanded", "true");
        setTimeout(() => searchInput?.focus(), 50);
      } else {
        filterPanel.classList.add("hidden");
        filterPanel.classList.remove("flex");
        if (toggleIcon) toggleIcon.classList.remove("rotate-180");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  // 4. Filter-Funktion
  function applyFilter() {
    const searchVal = (searchInput?.value || "").toLowerCase().trim();
    const yearVal = yearSelect?.value || "";
    const monthVal = monthSelect?.value || "";

    // Clear-Search Button sichtbar machen wenn Text vorhanden
    if (clearSearchBtn) {
      if (searchVal.length > 0) {
        clearSearchBtn.classList.remove("hidden");
      } else {
        clearSearchBtn.classList.add("hidden");
      }
    }

    let matchCount = 0;

    cards.forEach((card) => {
      const cardTitle = (card.getAttribute("data-title") || card.querySelector("h2")?.textContent || "").toLowerCase();
      const cardPreview = (card.querySelector("p")?.textContent || "").toLowerCase();
      const cardDate = (card.querySelector("span")?.textContent || "").toLowerCase();
      const cardYear = card.getAttribute("data-year") || "";
      const cardMonth = card.getAttribute("data-month") || "";

      const matchesSearch =
        searchVal === "" ||
        cardTitle.includes(searchVal) ||
        cardPreview.includes(searchVal) ||
        cardDate.includes(searchVal);

      const matchesYear = yearVal === "" || cardYear === yearVal;
      const matchesMonth = monthVal === "" || cardMonth === monthVal;

      if (matchesSearch && matchesYear && matchesMonth) {
        card.style.display = "";
        matchCount++;
      } else {
        card.style.display = "none";
      }
    });

    // Zähler & Empty State
    const hasFilterActive = searchVal !== "" || yearVal !== "" || monthVal !== "";

    if (activeBadge) {
      if (hasFilterActive) {
        activeBadge.classList.remove("hidden");
      } else {
        activeBadge.classList.add("hidden");
      }
    }

    if (resetBtn) {
      if (hasFilterActive) {
        resetBtn.classList.remove("hidden");
      } else {
        resetBtn.classList.add("hidden");
      }
    }

    if (countEl) {
      if (hasFilterActive) {
        countEl.textContent = `${matchCount} von ${cards.length} Beitrag/Beiträgen`;
        countEl.classList.remove("hidden");
      } else {
        countEl.classList.add("hidden");
      }
    }

    if (emptyState) {
      if (matchCount === 0) {
        emptyState.classList.remove("hidden");
      } else {
        emptyState.classList.add("hidden");
      }
    }
  }

  // 5. Reset-Funktion
  function resetFilters() {
    if (searchInput) searchInput.value = "";
    if (yearSelect) yearSelect.value = "";
    if (monthSelect) monthSelect.value = "";
    applyFilter();
    if (searchInput) searchInput.focus();
  }

  // Event Listener
  if (searchInput) searchInput.addEventListener("input", applyFilter);
  if (yearSelect) yearSelect.addEventListener("change", applyFilter);
  if (monthSelect) monthSelect.addEventListener("change", applyFilter);
  if (resetBtn) resetBtn.addEventListener("click", resetFilters);
  if (resetEmptyBtn) resetEmptyBtn.addEventListener("click", resetFilters);
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      applyFilter();
      searchInput?.focus();
    });
  }
});
