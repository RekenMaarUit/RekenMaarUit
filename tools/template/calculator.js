const form = document.getElementById("calculator-form");
const resultaat = document.getElementById("resultaat");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const voorbeeld = Number(
        document.getElementById("voorbeeld").value
    );

    if (!Number.isFinite(voorbeeld) || voorbeeld < 0) {
        resultaat.innerHTML = `
        <p class="result-card__label">Uitkomst</p>
        <h2>Controleer de invoer</h2>
        <p>Vul een geldige waarde in.</p>
        `;
        return;
    }

    const uitkomst = voorbeeld;

    resultaat.innerHTML = `
    <p class="result-card__label">Uitkomst</p>
    <h2>${formatGetal(uitkomst)}</h2>
    <p>Vervang dit door een duidelijke berekening.</p>
    `;
});

form.addEventListener("reset", function () {
    window.setTimeout(function () {
        resultaat.innerHTML = `
        <p class="result-card__label">Uitkomst</p>
        <h2>Nog niets berekend</h2>
        <p>
        Vul de gegevens in en klik op
        <strong>Bereken</strong>.
        </p>
        `;
    }, 0);
});

function formatGetal(getal) {
    return new Intl.NumberFormat("nl-NL", {
        maximumFractionDigits: 2
    }).format(getal);
}
