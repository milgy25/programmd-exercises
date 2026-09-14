/**
 * Exercise Glossary — client-side search + facet filter.
 *
 * Plain browser JS: no module system, no build step, no external dependency, no `fetch()`.
 * A `fetch()` of a local JSON sidecar is blocked under the `file://` protocol, which would break
 * the zero-server guarantee the moment Miles double-clicks index.html (D-03) — so every filter
 * value this script reads is already inlined in the card's own `data-*` attributes.
 *
 * Facet semantics (D-04): OR within a group, AND across groups, AND with the search text.
 * Ticking "dumbbell" and "cable" shows dumbbell OR cable; adding "chest" narrows that to
 * (dumbbell OR cable) AND chest; the search box narrows whatever remains.
 *
 * The query is only ever compared with String.prototype.includes against a data attribute and
 * written to the page via textContent — never interpolated into a CSS selector, never written
 * via innerHTML (T-E5M-04, same rule the live preview already follows for slot ids).
 *
 * The grid is fully server-rendered: with this script disabled or failing to load, every card
 * still shows — the controls are simply inert. Nothing here gates the grid.
 */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
    var searchInput = document.getElementById("search");
    var resultCount = document.getElementById("result-count");
    var emptyState = document.getElementById("empty-state");
    var clearAllButton = document.getElementById("clear-all");
    var allCheckboxes = Array.prototype.slice.call(
      document.querySelectorAll('input[type="checkbox"][data-group]'),
    );
    var equipmentBoxes = allCheckboxes.filter(function (box) {
      return box.getAttribute("data-group") === "equipment";
    });
    var muscleBoxes = allCheckboxes.filter(function (box) {
      return box.getAttribute("data-group") === "muscles";
    });

    // The grid is complete without this script; if the expected controls are not all present,
    // do nothing rather than risk hiding cards a reader can no longer reveal.
    if (cards.length === 0 || !searchInput || !resultCount) return;

    var total = cards.length;

    function checkedValueSet(boxes) {
      var set = {};
      for (var i = 0; i < boxes.length; i += 1) {
        if (boxes[i].checked) set[boxes[i].value] = true;
      }
      return set;
    }

    function tokenSetIntersects(dataAttrValue, wantedSet) {
      var wantedKeys = Object.keys(wantedSet);
      if (wantedKeys.length === 0) return true; // nothing ticked in this group -> no restriction
      var tokens = dataAttrValue ? dataAttrValue.split(" ") : [];
      for (var i = 0; i < wantedKeys.length; i += 1) {
        if (tokens.indexOf(wantedKeys[i]) !== -1) return true;
      }
      return false;
    }

    function applyFilters() {
      var query = searchInput.value.trim().toLowerCase();
      var wantedEquipment = checkedValueSet(equipmentBoxes);
      var wantedMuscles = checkedValueSet(muscleBoxes);
      var shown = 0;

      for (var i = 0; i < cards.length; i += 1) {
        var card = cards[i];
        var item = card.closest("li") || card;
        var searchData = card.getAttribute("data-search") || "";
        var equipmentData = card.getAttribute("data-equipment") || "";
        var musclesData = card.getAttribute("data-muscles") || "";

        var matchesSearch = query === "" || searchData.indexOf(query) !== -1;
        var matchesEquipment = tokenSetIntersects(equipmentData, wantedEquipment);
        var matchesMuscles = tokenSetIntersects(musclesData, wantedMuscles);
        var visible = matchesSearch && matchesEquipment && matchesMuscles;

        item.hidden = !visible;
        if (visible) shown += 1;
      }

      resultCount.textContent = "Showing " + shown + " of " + total;

      if (emptyState) {
        emptyState.hidden = shown !== 0;
      }
    }

    searchInput.addEventListener("input", applyFilters);
    allCheckboxes.forEach(function (box) {
      box.addEventListener("change", applyFilters);
    });

    if (clearAllButton) {
      clearAllButton.addEventListener("click", function () {
        searchInput.value = "";
        allCheckboxes.forEach(function (box) {
          box.checked = false;
        });
        applyFilters();
        searchInput.focus();
      });
    }

    applyFilters();
  });
})();
