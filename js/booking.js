// ==========================================================================
// Nozoul Booking Integration - Motel Safari Budget
// ==========================================================================

const NOZOUL_BASE_URL = "https://safarimotelbudget.nozoul.ma/#/be/6e4df1c3-746c-473a-993f-7e09dc57700f/book";

/**
 * Builds the Nozoul booking URL from the given search parameters.
 * @param {Object} params
 * @param {string} params.checkIn - ISO date (YYYY-MM-DD)
 * @param {string} params.checkOut - ISO date (YYYY-MM-DD)
 * @param {number|string} params.adults
 * @param {number|string} params.children
 * @param {Array<number|string>} params.childAges
 * @returns {string} full Nozoul URL
 */
function buildNozoulUrl({ checkIn, checkOut, adults, children, childAges }) {
  const period = `${checkIn},${checkOut}`;
  const childCount = parseInt(children, 10) || 0;

  const params = new URLSearchParams();
  params.set("period", period);
  params.set("adults", adults || 1);

  if (childCount > 0) {
    params.set("child", childCount);
    const ages = (childAges || []).filter(a => a !== "" && a !== undefined && a !== null).join(",");
    if (ages) {
      params.set("ages", ages);
    }
  }

  return `${NOZOUL_BASE_URL}?${params.toString()}`;
}

/**
 * Renders the dynamic "age per child" select fields inside the given container.
 * @param {HTMLElement} container
 * @param {number} count - number of children
 */
function renderChildAgeFields(container, count) {
  container.innerHTML = "";
  if (!count || count <= 0) {
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";
  for (let i = 1; i <= count; i++) {
    const col = document.createElement("div");
    col.className = "col-md-4 child-age-group";
    const label = document.createElement("label");
    label.textContent = `Âge enfant ${i}`;
    const select = document.createElement("select");
    select.className = "form-control child-age-select";
    select.dataset.childIndex = i;
    select.required = true;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Âge ?";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    for (let age = 0; age <= 12; age++) {
      const option = document.createElement("option");
      option.value = age;
      option.textContent = age;
      select.appendChild(option);
    }
    col.appendChild(label);
    col.appendChild(select);
    container.appendChild(col);
  }
}

function collectChildAges(container) {
  return Array.from(container.querySelectorAll(".child-age-select")).map(sel => sel.value);
}


// --- Dates: bloquer les jours passés -------------------------------------
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return toISODate(new Date(y, m - 1, d + n));
}

document.addEventListener("DOMContentLoaded", function () {
  const barCheckIn = document.getElementById("barCheckIn");
  const barCheckOut = document.getElementById("barCheckOut");
  const barAdultes = document.getElementById("barAdultes");
  const barEnfants = document.getElementById("barEnfants");
  const barEnfantsAges = document.getElementById("barEnfantsAges");
  const barSubmit = document.getElementById("barSubmit");


  // Les jours passés sont grisés / non sélectionnables dans le calendrier
  const today = toISODate(new Date());
  if (barCheckIn && barCheckOut) {
    barCheckIn.min = today;
    barCheckOut.min = addDays(today, 1);

    barCheckIn.addEventListener("change", function () {
      if (!this.value) {
        barCheckOut.min = addDays(today, 1);
        return;
      }
      const minOut = addDays(this.value, 1);
      barCheckOut.min = minOut;
      if (barCheckOut.value && barCheckOut.value < minOut) {
        barCheckOut.value = "";
      }
    });
  }

  // Show/hide dynamic child-age selects when the "Enfants" count changes
  if (barEnfants && barEnfantsAges) {
    barEnfants.addEventListener("change", function () {
      const count = parseInt(this.value, 10) || 0;
      renderChildAgeFields(barEnfantsAges, count);
    });
  }

  // Vérifier -> validate then redirect straight to Nozoul
  if (barSubmit) {
    barSubmit.addEventListener("click", function () {
      const checkIn = barCheckIn ? barCheckIn.value : "";
      const checkOut = barCheckOut ? barCheckOut.value : "";
      const adults = barAdultes ? barAdultes.value : "1";
      const children = barEnfants ? barEnfants.value : "0";
      const childCount = parseInt(children, 10) || 0;
      const childAges = collectChildAges(barEnfantsAges);

      if (!checkIn || !checkOut) {
        alert("Merci de sélectionner une date d'arrivée et de départ.");
        return;
      }

      if (checkIn < today) {
        alert("La date d'arrivée ne peut pas être dans le passé.");
        return;
      }

      if (checkOut <= checkIn) {
        alert("La date de départ doit être après la date d'arrivée.");
        return;
      }

      if (childCount > 0 && (childAges.length < childCount || childAges.some(a => a === ""))) {
        alert("Merci de préciser l'âge de chaque enfant.");
        return;
      }

      const url = buildNozoulUrl({ checkIn, checkOut, adults, children, childAges });
      window.open(url, "_blank");
    });
  }
});
