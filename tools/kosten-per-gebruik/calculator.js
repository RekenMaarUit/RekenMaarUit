const form = document.getElementById("kosten-per-gebruik-form");
const resultaat = document.getElementById("resultaat");
const uitgebreidresultaat = document.getElementById("uitgebreid-resultaat");

form.addEventListener("submit", bereken);
const euroFormatter = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
});

function bereken(event) {
    event.preventDefault();

    const aanschafprijs = getNumber("aanschafprijs");

    const aantalgebruiken = getNumber("aantal-gebruiken");

    const gebruiksfrequentie = getValue("gebruiksfrequentie");

    const gebruiksperiode = getNumber("gebruiksperiode");

    const periodeeenheid = getValue("periode-eenheid");

    const restwaarde = getNumber("restwaarde");

    const terugkerendekosten = getNumber("terugkerende-kosten");

    const terugkerendekostenfrequentie = getValue("terugkerende-kostenfrequentie");

    const periodeTekst = getValue("periode-eenheid");


    const gebruiksperiodeInJaren =
    naarJaren(gebruiksperiode, periodeeenheid);

    const gebruikenPerJaar =
    naarPerJaar(aantalgebruiken, gebruiksfrequentie);

    const terugkerendekostenPerJaar =
    naarPerJaar(terugkerendekosten, terugkerendekostenfrequentie);

    const totaleAfschrijving =
    aanschafprijs - restwaarde;

    const afschrijvingPerJaar =
    totaleAfschrijving / gebruiksperiodeInJaren;

    const totaleterugkerendekosten =
    terugkerendekostenPerJaar * gebruiksperiodeInJaren;

    const totaleKosten =
    totaleAfschrijving + totaleterugkerendekosten;

    const totaleKostenPerJaar =
    totaleKosten / gebruiksperiodeInJaren;

    const totaalAantalGebruiken =
    gebruikenPerJaar * gebruiksperiodeInJaren;

    const kostenPerGebruik =
    totaleKosten / totaalAantalGebruiken;

    const kostenPerGekozenPeriode =
    vanPerJaar(totaleKostenPerJaar, periodeeenheid);

    const totaleKostenPerPeriode =
    vanPerJaar(totaleKostenPerJaar, periodeeenheid);

    const afschrijvingPerPeriode =
    vanPerJaar(afschrijvingPerJaar, periodeeenheid);

    const terugkerendeKostenPerPeriode =
    vanPerJaar(terugkerendekostenPerJaar, periodeeenheid);

    const gebruikenPerPeriode =
    vanPerJaar(gebruikenPerJaar, periodeeenheid);







    resultaat.innerHTML = `
    <p class="result-card__label">Kosten per gebruik</p>

    <h2>${euroFormatter.format(kostenPerGebruik)}</h2>

    <p>
    Op basis van ongeveer
    ${Math.round(totaalAantalGebruiken).toLocaleString("nl-NL")}
    gebruiksmomenten.
    </p>
    `;


    uitgebreidresultaat.innerHTML = `
    <h2>Uitgebreide berekening</h2>

    <div class="expandedresult-card">
        <h3>Gemiddeld per ${periodeTekst}</h3>

        <dl class="result-list">
            <div>
                <dt>Afschrijving</dt>
                <dd>${euroFormatter.format(afschrijvingPerPeriode)}</dd>
            </div>

            <div>
                <dt>Terugkerende kosten</dt>
                <dd>${euroFormatter.format(terugkerendeKostenPerPeriode)}</dd>
            </div>

            <div>
                <dt>Totale kosten</dt>
                <dd>${euroFormatter.format(totaleKostenPerPeriode)}</dd>
            </div>

            <div>
                <dt>Gebruiksmomenten</dt>
                <dd>${Math.round(gebruikenPerPeriode).toLocaleString("nl-NL")}</dd>
            </div>
        </dl>
    </div>

    <div class="expandedresult-card">
        <h3>Over de hele gebruiksperiode</h3>

        <dl class="result-list">
            <div>
                <dt>Totale afschrijving</dt>
                <dd>${euroFormatter.format(totaleAfschrijving)}</dd>
            </div>

            <div>
                <dt>Totale terugkerende kosten</dt>
                <dd>${euroFormatter.format(totaleterugkerendekosten)}</dd>
            </div>

            <div>
                <dt>Totale kosten</dt>
                <dd>${euroFormatter.format(totaleKosten)}</dd>
            </div>

            <div>
                <dt>Totaal aantal gebruiksmomenten</dt>
                <dd>${Math.round(totaalAantalGebruiken).toLocaleString("nl-NL")}</dd>
            </div>
        </dl>
    </div>
    `;
if (totaalAantalGebruiken < 1) {
    resultaat.innerHTML = `
        <p class="expandedresult-card">Controleer je invoer</p>
        <h2>Minder dan één verwacht gebruik</h2>
        <p>
            Binnen deze gebruiksperiode komt de gekozen gebruiksfrequentie
            neer op minder dan één gebruiksmoment.
        </p>
    `;

    detailResultaat.innerHTML = "";
    return;
}



}

function naarPerJaar(waarde, eenheid){
    if (eenheid == "dag"){
        return waarde * 365;
    }
    if (eenheid == "week"){
        return waarde * 52;
    }
    if (eenheid == "maand"){
        return waarde * 12;
    }
    if (eenheid == "jaar"){
        return waarde;
    }
    return 0
}

function naarJaren(waarde, eenheid){
    if (eenheid == "dag"){
        return waarde / 365;
    }
    if (eenheid == "week"){
        return waarde / 52;
    }
    if (eenheid == "maand"){
        return waarde / 12;
    }
    if (eenheid == "jaar"){
        return waarde;
    }
    return 0
}

function vanPerJaar(waarde, eenheid) {
    if (eenheid == "dag") {
        return waarde / 365;
    }
    if (eenheid == "week") {
        return waarde / 52;
    }
    if (eenheid == "maand") {
        return waarde / 12;
    }
    if (eenheid == "jaar") {
        return waarde;
    }
    return 0;
}


function getNumber(id) {
    const waarde = getValue(id);

    if (waarde === null) {
        return NaN;
    }

    return Number(waarde);
}

function getValue(id) {
    const element = document.getElementById(id);

    if (!element) {
        console.error(`Element met id "${id}" niet gevonden.`);
        return null;
    }

    return element.value;
}
