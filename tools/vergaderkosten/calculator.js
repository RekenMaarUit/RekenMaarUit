const form = document.getElementById("vergaderkosten-form");
const resultaat = document.getElementById("resultaat");

const euroFormatter = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
});

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const deelnemers = Number(document.getElementById("deelnemers").value);
    const uurtarief = Number(document.getElementById("uurtarief").value);
    const duurMinuten = Number(document.getElementById("duur").value);

    if (
        !Number.isFinite(deelnemers) ||
        !Number.isFinite(uurtarief) ||
        !Number.isFinite(duurMinuten) ||
        deelnemers < 1 ||
        uurtarief < 0 ||
        duurMinuten < 1
    ) {
        resultaat.innerHTML = `
        <h2>Resultaat</h2>
        <p>Controleer de ingevulde waarden.</p>
        `;
        return;
    }

    const duurUren = duurMinuten / 60;
    const totaleKosten = deelnemers * uurtarief * duurUren;

    resultaat.innerHTML = `
    <h2>Geschatte vergaderkosten</h2>

    <p>
    <strong>${euroFormatter.format(totaleKosten)}</strong>
    </p>

    <p>
    ${deelnemers} deelnemers ×
    ${euroFormatter.format(uurtarief)} per uur ×
    ${formatGetal(duurUren)} uur =
    ${euroFormatter.format(totaleKosten)}
    </p>
    `;
});

form.addEventListener("reset", function () {
    window.setTimeout(function () {
        resultaat.innerHTML = `
        <h2>Resultaat</h2>
        <p>
        Vul de gegevens in en klik op <strong>Bereken</strong>.
        </p>
        `;
    }, 0);
});

function formatGetal(getal) {
    return new Intl.NumberFormat("nl-NL", {
        maximumFractionDigits: 2
    }).format(getal);
}
