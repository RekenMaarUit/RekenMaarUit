const form = document.getElementById("kosten-per-gebruik-form");
const resultaat = document.getElementById("resultaat");

form.addEventListener("submit", bereken);
const euroFormatter = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR"
});

function bereken(event) {
    event.preventDefault();

    const aanschafprijs = getValue("aanschafprijs");

    const aantalgebruiken = getValue("aantal-gebruiken");

    const gebruiksfrequentie = getValue("gebruiksfrequentie");

    const gebruiksperiode = getValue("gebruiksperiode");

    const periodeeenheid = getValue("periode-eenheid");

    const restwaarde = getValue("restwaarde");

    const onderhoud = getValue("onderhoud");

    const onderhoudsfrequentie = getValue("onderhoudsfrequentie");


    const gebruiksperiodeInJaren =
    naarJaren(gebruiksperiode, periodeeenheid);

    const gebruikenPerJaar =
    naarPerJaar(aantalgebruiken, gebruiksfrequentie);

    const onderhoudPerJaar =
    naarPerJaar(onderhoud, onderhoudsfrequentie);

    const totaleAfschrijving =
    aanschafprijs - restwaarde;

    const afschrijvingPerJaar =
    totaleAfschrijving / gebruiksperiodeInJaren;

    const totaleOnderhoudskosten =
    onderhoudPerJaar * gebruiksperiodeInJaren;

    const totaleKosten =
    totaleAfschrijving + totaleOnderhoudskosten;

    const totaleKostenPerJaar =
    totaleKosten / gebruiksperiodeInJaren;

    const totaalAantalGebruiken =
    gebruikenPerJaar * gebruiksperiodeInJaren;

    const kostenPerGebruik =
    totaleKosten / totaalAantalGebruiken;


    resultaat.innerHTML = `
    <p class="result-card__label">Kosten per gebruik</p>

    <h2>${euroFormatter.format(kostenPerGebruik)}</h2>

    <p>
    Op basis van ongeveer
    ${Math.round(totaalAantalGebruiken).toLocaleString("nl-NL")}
    gebruiksmomenten.
    </p>
    `;



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

function getValue(id) {
    return document.getElementById(id).value;
}
