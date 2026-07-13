"use strict";

const form = document.getElementById("zaagcalculator-form");
const resultContainer = document.getElementById("resultaat");
const errorContainer = document.getElementById("invoerfouten");
const cuttingPlanSection = document.getElementById("zaagplan-resultaat");
const cuttingPlanContainer = document.getElementById("zaagplan-inhoud");
const cuttingPlanMethod = document.getElementById("zaagplan-methode");

form.addEventListener("submit", handleSubmit);

/**
 * Verwerkt het formulier.
 *
 * @param {SubmitEvent} event
 */
function handleSubmit(event) {
    event.preventDefault();

    clearErrors();

    const input = readFormInput();
    const validation = validateInput(input);

    if (!validation.isValid) {
        showErrors(validation.errors);
        showEmptyResult();
        return;
    }

    const pieces = expandPieces(
        validation.rows,
        input.allowance
    );

    const cuttingPlan = firstFitDecreasing(
        pieces,
        input.usableLength
    );

    renderResult({
        stockLength: input.stockLength,
        usableLength: input.usableLength,
        allowance: input.allowance,
        rows: validation.rows,
        pieces,
        cuttingPlan
    });
}

/**
 * Leest de waarden uit het formulier.
 *
 * @returns {{
 *     stockLength: number,
 *     usableLength: number,
 *     allowance: number,
 *     method: string,
 *     rawParts: string
 * }}
 */
function readFormInput() {
    return {
        stockLength: Number(
            document.getElementById("uitgangslengte").value
        ),
        usableLength: Number(
            document.getElementById("bruikbare-lengte").value
        ),
        allowance: Number(
            document.getElementById("toeslag").value
        ),
        method: document.getElementById("berekenmethode").value,
        rawParts: document.getElementById("onderdelen").value
    };
}

/**
 * Controleert de algemene invoer en leest de onderdelenregels.
 *
 * @param {{
 *     stockLength: number,
 *     usableLength: number,
 *     allowance: number,
 *     method: string,
 *     rawParts: string
 * }} input
 *
 * @returns {{
 *     isValid: boolean,
 *     errors: string[],
 *     rows: Array<{
 *         length: number,
 *         quantity: number,
 *         sourceLine: number
 *     }>
 * }}
 */
function validateInput(input) {
    const errors = [];

    if (!Number.isFinite(input.stockLength) || input.stockLength <= 0) {
        errors.push(
            "De uitgangslengte moet groter zijn dan 0 mm."
        );
    }

    if (!Number.isFinite(input.usableLength) || input.usableLength <= 0) {
        errors.push(
            "De effectief bruikbare lengte moet groter zijn dan 0 mm."
        );
    }

    if (
        Number.isFinite(input.stockLength) &&
        Number.isFinite(input.usableLength) &&
        input.usableLength > input.stockLength
    ) {
        errors.push(
            "De effectief bruikbare lengte kan niet groter zijn dan de uitgangslengte."
        );
    }

    if (!Number.isFinite(input.allowance) || input.allowance < 0) {
        errors.push(
            "De toeslag per onderdeel moet 0 mm of groter zijn."
        );
    }

    const parsedRows = parseParts(input.rawParts);

    errors.push(...parsedRows.errors);

    if (parsedRows.rows.length === 0) {
        errors.push(
            "Voer minimaal één geldige regel met lengte en aantal in."
        );
    }

    if (
        Number.isFinite(input.usableLength) &&
        Number.isFinite(input.allowance)
    ) {
        for (const row of parsedRows.rows) {
            const calculationLength = row.length + input.allowance;

            if (calculationLength > input.usableLength) {
                errors.push(
                    `Regel ${row.sourceLine}: ${formatMillimetres(row.length)} + ` +
                    `${formatMillimetres(input.allowance)} toeslag past niet binnen ` +
                    `${formatMillimetres(input.usableLength)} bruikbare lengte.`
                );
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        rows: parsedRows.rows
    };
}

/**
 * Leest twee geplakte kolommen:
 * lengte en aantal.
 *
 * Ondersteunde scheiding:
 * - tabs uit Excel;
 * - puntkomma;
 * - meerdere spaties.
 *
 * @param {string} rawInput
 *
 * @returns {{
 *     rows: Array<{
 *         length: number,
 *         quantity: number,
 *         sourceLine: number
 *     }>,
 *     errors: string[]
 * }}
 */
function parseParts(rawInput) {
    const rows = [];
    const errors = [];

    const lines = rawInput
    .split(/\r?\n/)
    .map((line, index) => ({
        text: line.trim(),
                           sourceLine: index + 1
    }))
    .filter((line) => line.text !== "");

    for (const line of lines) {
        const columns = splitLine(line.text);

        if (columns.length < 2) {
            errors.push(
                `Regel ${line.sourceLine}: vul een lengte en een aantal in.`
            );
            continue;
        }

        const length = parsePositiveInteger(columns[0]);
        const quantity = parsePositiveInteger(columns[1]);

        if (length === null) {
            errors.push(
                `Regel ${line.sourceLine}: "${columns[0]}" is geen geldige lengte.`
            );
        }

        if (quantity === null) {
            errors.push(
                `Regel ${line.sourceLine}: "${columns[1]}" is geen geldig aantal.`
            );
        }

        if (length === null || quantity === null) {
            continue;
        }

        rows.push({
            length,
            quantity,
            sourceLine: line.sourceLine
        });
    }

    return {
        rows,
        errors
    };
}

/**
 * Splitst een regel op tab, puntkomma of meerdere spaties.
 *
 * @param {string} line
 * @returns {string[]}
 */
function splitLine(line) {
    if (line.includes("\t")) {
        return line
        .split("\t")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    if (line.includes(";")) {
        return line
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return line
    .split(/\s{2,}/)
    .map((value) => value.trim())
    .filter(Boolean);
}

/**
 * Leest een geheel getal groter dan 0.
 *
 * @param {string} value
 * @returns {number|null}
 */
function parsePositiveInteger(value) {
    const normalizedValue = value
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");

    const number = Number(normalizedValue);

    if (
        !Number.isFinite(number) ||
        number <= 0 ||
        !Number.isInteger(number)
    ) {
        return null;
    }

    return number;
}

/**
 * Zet aantallen om in losse onderdelen.
 *
 * @param {Array<{
 *     length: number,
 *     quantity: number,
 *     sourceLine: number
 * }>} rows
 * @param {number} allowance
 *
 * @returns {Array<{
 *     id: number,
 *     length: number,
 *     allowance: number,
 *     calculationLength: number
 * }>}
 */
function expandPieces(rows, allowance) {
    const pieces = [];
    let id = 1;

    for (const row of rows) {
        for (let index = 0; index < row.quantity; index += 1) {
            pieces.push({
                id,
                length: row.length,
                allowance,
                calculationLength: row.length + allowance
            });

            id += 1;
        }
    }

    return pieces;
}

/**
 * First Fit Decreasing.
 *
 * Onderdelen worden lang naar kort gesorteerd.
 * Daarna gaat ieder onderdeel in de eerste staaf waarin het past.
 *
 * @param {Array<{
 *     id: number,
 *     length: number,
 *     allowance: number,
 *     calculationLength: number
 * }>} pieces
 * @param {number} usableLength
 *
 * @returns {Array<{
 *     pieces: Array,
 *     usedLength: number,
 *     remainingLength: number
 * }>}
 */
function firstFitDecreasing(pieces, usableLength) {
    const sortedPieces = [...pieces].sort((pieceA, pieceB) => {
        if (pieceB.calculationLength !== pieceA.calculationLength) {
            return pieceB.calculationLength - pieceA.calculationLength;
        }

        return pieceB.length - pieceA.length;
    });

    const bars = [];

    for (const piece of sortedPieces) {
        let placed = false;

        for (const bar of bars) {
            if (piece.calculationLength <= bar.remainingLength) {
                bar.pieces.push(piece);
                bar.usedLength += piece.calculationLength;
                bar.remainingLength -= piece.calculationLength;
                placed = true;
                break;
            }
        }

        if (!placed) {
            bars.push({
                pieces: [piece],
                usedLength: piece.calculationLength,
                remainingLength:
                usableLength - piece.calculationLength
            });
        }
    }

    return bars;
}

/**
 * Toont de berekende resultaten.
 *
 * @param {{
 *     stockLength: number,
 *     usableLength: number,
 *     allowance: number,
 *     rows: Array,
 *     pieces: Array,
 *     cuttingPlan: Array
 * }} data
 */
function renderResult(data) {
    const numberOfBars = data.cuttingPlan.length;

    const totalProductLength = data.pieces.reduce(
        (total, piece) => total + piece.length,
                                                  0
    );

    const totalAllowance = data.pieces.reduce(
        (total, piece) => total + piece.allowance,
                                              0
    );

    const totalUsedLength =
    totalProductLength + totalAllowance;

    const totalUsableLength =
    numberOfBars * data.usableLength;

    const totalRemainingLength =
    totalUsableLength - totalUsedLength;

    const excludedLengthPerBar =
    data.stockLength - data.usableLength;

    const totalExcludedLength =
    numberOfBars * excludedLengthPerBar;

    const utilisation =
    totalUsableLength > 0
    ? (totalUsedLength / totalUsableLength) * 100
    : 0;

    resultContainer.innerHTML = `
    <p class="result-card__label">Samenvatting</p>

        <h2
        id="resultaat-heading"
        class="result-card__value"
        >
        ${numberOfBars}
        </h2>

        <p class="result-card__unit">
        ${numberOfBars === 1
            ? "uitgangslengte"
            : "uitgangslengtes"}
            </p>

        <div class="zaag-summary">
        ${createSummaryRow(
            "Aantal onderdelen",
            formatNumber(data.pieces.length)
        )}

        ${createSummaryRow(
            "Productlengte",
            formatMillimetres(totalProductLength)
        )}

        ${createSummaryRow(
            "Totale toeslag",
            formatMillimetres(totalAllowance)
        )}

        ${createSummaryRow(
            "Rest bruikbare lengte",
            formatMillimetres(totalRemainingLength)
        )}

        ${createSummaryRow(
            "Uitgesloten lengte",
            formatMillimetres(totalExcludedLength)
        )}

        ${createSummaryRow(
            "Benutting",
            `${formatDecimal(utilisation)}%`
        )}
        </div>
        `;

        cuttingPlanMethod.textContent =
        "First Fit Decreasing";

            cuttingPlanContainer.innerHTML = `
            <div class="zaagplan">
            ${data.cuttingPlan
                .map((bar, index) => {
                    return createBarHtml(
                        bar,
                        index,
                        data.usableLength
                    );
                })
                .join("")}
                </div>
                `;

                cuttingPlanSection.hidden = false;
}

/**
 * Maakt één regel van de samenvatting.
 *
 * @param {string} label
 * @param {string} value
 * @returns {string}
 */
function createSummaryRow(label, value) {
    return `
    <div class="zaag-summary__item">
    <span class="zaag-summary__label">${escapeHtml(label)}</span>
    <span class="zaag-summary__value">${escapeHtml(value)}</span>
    </div>
    `;
}

/**
 * Maakt de HTML voor één uitgangslengte.
 *
 * @param {{
 *     pieces: Array,
 *     usedLength: number,
 *     remainingLength: number
 * }} bar
 * @param {number} index
 * @param {number} usableLength
 * @returns {string}
 */
function createBarHtml(bar, index, usableLength) {
    const groupedPieces = groupPieces(bar.pieces);

    const piecesHtml = groupedPieces
    .map((group) => {
        const allowanceText =
        group.allowance > 0
        ? ` + ${formatMillimetres(group.allowance)} toeslag`
        : "";

        return `
        <li class="zaagplan-item__piece">
        ${formatMillimetres(group.length)}
        ${group.quantity > 1
            ? `× ${formatNumber(group.quantity)}`
            : ""}
            ${allowanceText}
            </li>
            `;
    })
    .join("");

    const barPartsHtml = bar.pieces
    .map((piece) => {
        const percentage =
        (piece.calculationLength / usableLength) * 100;

        return `
        <div
        class="zaagbalk__deel"
        style="width: ${percentage}%"
        title="${formatMillimetres(piece.length)} + ${formatMillimetres(piece.allowance)} toeslag"
        >
        ${formatMillimetres(piece.length)}
        </div>
        `;
    })
    .join("");

    const remainingPercentage =
    (bar.remainingLength / usableLength) * 100;

    const remainingHtml =
    bar.remainingLength > 0
    ? `
    <div
    class="zaagbalk__rest"
    style="width: ${remainingPercentage}%"
    title="${formatMillimetres(bar.remainingLength)} rest"
    >
    ${formatMillimetres(bar.remainingLength)}
    </div>
    `
    : "";

    return `
    <article class="zaagplan-item">
    <div class="zaagplan-item__header">
    <h3 class="zaagplan-item__title">
    Uitgangslengte ${index + 1}
    </h3>

    <p class="zaagplan-item__rest">
    Rest: ${formatMillimetres(bar.remainingLength)}
    </p>
    </div>

    <ul class="zaagplan-item__pieces">
    ${piecesHtml}
    </ul>

    <div
    class="zaagbalk"
    aria-label="Visuele indeling van uitgangslengte ${index + 1}"
    >
    ${barPartsHtml}
    ${remainingHtml}
    </div>

    <div class="zaagplan-item__details">
    <p>
    Gebruikt:
    <strong>${formatMillimetres(bar.usedLength)}</strong>
    </p>

    <p>
    Bruikbaar:
    <strong>${formatMillimetres(usableLength)}</strong>
    </p>

    <p>
    Onderdelen:
    <strong>${formatNumber(bar.pieces.length)}</strong>
    </p>
    </div>
    </article>
    `;
}

/**
 * Groepeert gelijke onderdelen voor compacte weergave.
 *
 * @param {Array<{
 *     length: number,
 *     allowance: number
 * }>} pieces
 *
 * @returns {Array<{
 *     length: number,
 *     allowance: number,
 *     quantity: number
 * }>}
 */
function groupPieces(pieces) {
    const groups = new Map();

    for (const piece of pieces) {
        const key = `${piece.length}-${piece.allowance}`;

        if (!groups.has(key)) {
            groups.set(key, {
                length: piece.length,
                allowance: piece.allowance,
                quantity: 0
            });
        }

        groups.get(key).quantity += 1;
    }

    return [...groups.values()];
}

/**
 * Toont invoerfouten.
 *
 * @param {string[]} errors
 */
function showErrors(errors) {
    errorContainer.innerHTML = `
    <p><strong>Controleer de invoer:</strong></p>
    <ul>
    ${errors
        .map((error) => `<li>${escapeHtml(error)}</li>`)
        .join("")}
        </ul>
        `;

        errorContainer.hidden = false;
        errorContainer.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
}

/**
 * Verbergt oude foutmeldingen.
 */
function clearErrors() {
    errorContainer.hidden = true;
    errorContainer.innerHTML = "";
}

/**
 * Zet de resultaatkaart terug naar de beginstatus.
 */
function showEmptyResult() {
    resultContainer.innerHTML = `
    <p class="result-card__label">Uitkomst</p>

    <h2 id="resultaat-heading">
    Nog niets berekend
    </h2>

    <p>
    Controleer de invoer en probeer het opnieuw.
    </p>
    `;

    cuttingPlanSection.hidden = true;
    cuttingPlanContainer.innerHTML = "";
    cuttingPlanMethod.textContent = "";
}

/**
 * Formatteert millimeters.
 *
 * @param {number} value
 * @returns {string}
 */
function formatMillimetres(value) {
    return `${formatNumber(value)} mm`;
}

/**
 * Formatteert gehele getallen volgens Nederlandse schrijfwijze.
 *
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
    return new Intl.NumberFormat("nl-NL", {
        maximumFractionDigits: 0
    }).format(value);
}

/**
 * Formatteert een getal met één decimaal.
 *
 * @param {number} value
 * @returns {string}
 */
function formatDecimal(value) {
    return new Intl.NumberFormat("nl-NL", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    }).format(value);
}

/**
 * Voorkomt dat ingevoerde tekst als HTML wordt uitgevoerd.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
    return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
