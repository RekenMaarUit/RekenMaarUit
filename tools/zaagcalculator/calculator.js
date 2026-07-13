"use strict";

/* =========================================================
 *   Instellingen en DOM-elementen
 *   ========================================================= */

const METHODS = {
    FIRST_FIT: {
        value: "first-fit",
        name: "First Fit Decreasing",
        label: "Praktisch zaagplan"
    },

    BEST_FIT: {
        value: "best-fit",
        name: "Best Fit Decreasing",
        label: "Materiaalgericht"
    }
};

const form = document.getElementById("zaagcalculator-form");
const resultContainer = document.getElementById("resultaat");
const errorContainer = document.getElementById("invoerfouten");

const cuttingPlanSection =
document.getElementById("zaagplan-resultaat");

const cuttingPlanContainer =
document.getElementById("zaagplan-inhoud");

const cuttingPlanMethod =
document.getElementById("zaagplan-methode");

form.addEventListener("submit", handleSubmit);


/* =========================================================
 *   Hoofdproces
 *   ========================================================= */

/**
 * Verwerkt het formulier en toont het berekende zaagplan.
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

    const result = calculateCuttingResult(
        input,
        validation.rows
    );

    renderResult(result);
}

/**
 * Maakt alle losse onderdelen aan, voert de gekozen
 * berekenmethode uit en berekent de samenvatting.
 *
 * @param {{
 *     stockLength: number,
 *     usableLength: number,
 *     allowance: number,
 *     method: string,
 *     rawParts: string
 * }} input
 *
 * @param {Array<{
 *     length: number,
 *     quantity: number,
 *     sourceLine: number
 * }>} rows
 *
 * @returns {{
 *     stockLength: number,
 *     usableLength: number,
 *     allowance: number,
 *     pieces: Array,
 *     cuttingPlan: Array,
 *     methodName: string,
 *     methodLabel: string,
 *     summary: {
 *         numberOfBars: number,
 *         totalProductLength: number,
 *         totalAllowance: number,
 *         totalUsedLength: number,
 *         totalUsableLength: number,
 *         totalRemainingLength: number,
 *         totalExcludedLength: number,
 *         utilisation: number
 *     }
 * }}
 */
function calculateCuttingResult(input, rows) {
    const pieces = expandPieces(
        rows,
        input.allowance
    );

    const calculation = calculateCuttingPlan(
        pieces,
        input.usableLength,
        input.method
    );

    const summary = calculateSummary({
        stockLength: input.stockLength,
        usableLength: input.usableLength,
        pieces,
        cuttingPlan: calculation.cuttingPlan
    });

    return {
        stockLength: input.stockLength,
        usableLength: input.usableLength,
        allowance: input.allowance,
        pieces,
        cuttingPlan: calculation.cuttingPlan,
        methodName: calculation.methodName,
        methodLabel: calculation.methodLabel,
        summary
    };
}

/**
 * Voert de gekozen berekenmethode uit.
 *
 * @param {Array} pieces
 * @param {number} usableLength
 * @param {string} method
 *
 * @returns {{
 *     cuttingPlan: Array,
 *     methodName: string,
 *     methodLabel: string
 * }}
 */
function calculateCuttingPlan(
    pieces,
    usableLength,
    method
) {
    switch (method) {
        case METHODS.BEST_FIT.value:
            return {
                cuttingPlan: bestFitDecreasing(
                    pieces,
                    usableLength
                ),
                methodName: METHODS.BEST_FIT.name,
                methodLabel: METHODS.BEST_FIT.label
            };

        case METHODS.FIRST_FIT.value:
        default:
            return {
                cuttingPlan: firstFitDecreasing(
                    pieces,
                    usableLength
                ),
                methodName: METHODS.FIRST_FIT.name,
                methodLabel: METHODS.FIRST_FIT.label
            };
    }
}


/* =========================================================
 *   Invoer
 *   ========================================================= */

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

        method:
        document.getElementById("berekenmethode").value,

        rawParts:
        document.getElementById("onderdelen").value
    };
}


/* =========================================================
 *   Validatie en parser
 *   ========================================================= */

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

    validateLengths(input, errors);
    validateAllowance(input.allowance, errors);
    validateMethod(input.method, errors);

    const parsedRows = parseParts(input.rawParts);

    errors.push(...parsedRows.errors);

    if (parsedRows.rows.length === 0) {
        errors.push(
            "Voer minimaal één geldige regel met lengte en aantal in."
        );
    }

    validatePartsFit(
        parsedRows.rows,
        input.usableLength,
        input.allowance,
        errors
    );

    return {
        isValid: errors.length === 0,
        errors,
        rows: parsedRows.rows
    };
}

/**
 * Controleert uitgangslengte en bruikbare lengte.
 *
 * @param {{
 *     stockLength: number,
 *     usableLength: number
 * }} input
 * @param {string[]} errors
 */
function validateLengths(input, errors) {
    if (
        !Number.isFinite(input.stockLength) ||
        input.stockLength <= 0
    ) {
        errors.push(
            "De uitgangslengte moet groter zijn dan 0 mm."
        );
    }

    if (
        !Number.isFinite(input.usableLength) ||
        input.usableLength <= 0
    ) {
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
}

/**
 * Controleert de toeslag per onderdeel.
 *
 * @param {number} allowance
 * @param {string[]} errors
 */
function validateAllowance(allowance, errors) {
    if (
        !Number.isFinite(allowance) ||
        allowance < 0
    ) {
        errors.push(
            "De toeslag per onderdeel moet 0 mm of groter zijn."
        );
    }
}

/**
 * Controleert of de gekozen methode bekend is.
 *
 * @param {string} method
 * @param {string[]} errors
 */
function validateMethod(method, errors) {
    const validMethods = [
        METHODS.FIRST_FIT.value,
        METHODS.BEST_FIT.value
    ];

    if (!validMethods.includes(method)) {
        errors.push(
            "De gekozen berekenmethode is niet geldig."
        );
    }
}

/**
 * Controleert of ieder onderdeel inclusief toeslag past.
 *
 * @param {Array<{
 *     length: number,
 *     quantity: number,
 *     sourceLine: number
 * }>} rows
 * @param {number} usableLength
 * @param {number} allowance
 * @param {string[]} errors
 */
function validatePartsFit(
    rows,
    usableLength,
    allowance,
    errors
) {
    if (
        !Number.isFinite(usableLength) ||
        !Number.isFinite(allowance)
    ) {
        return;
    }

    for (const row of rows) {
        const calculationLength =
        row.length + allowance;

        if (calculationLength > usableLength) {
            errors.push(
                `Regel ${row.sourceLine}: ` +
                `${formatMillimetres(row.length)} + ` +
                `${formatMillimetres(allowance)} toeslag ` +
                `past niet binnen ` +
                `${formatMillimetres(usableLength)} ` +
                `bruikbare lengte.`
            );
        }
    }
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
                `Regel ${line.sourceLine}: ` +
                "vul een lengte en een aantal in."
            );
            continue;
        }

        const length =
        parsePositiveInteger(columns[0]);

        const quantity =
        parsePositiveInteger(columns[1]);

        if (length === null) {
            errors.push(
                `Regel ${line.sourceLine}: ` +
                `"${columns[0]}" is geen geldige lengte.`
            );
        }

        if (quantity === null) {
            errors.push(
                `Regel ${line.sourceLine}: ` +
                `"${columns[1]}" is geen geldig aantal.`
            );
        }

        if (
            length === null ||
            quantity === null
        ) {
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
 * Splitst een regel op tab, puntkomma
 * of meerdere spaties.
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


/* =========================================================
 *   Onderdelen
 *   ========================================================= */

/**
 * Zet aantallen om in losse onderdelen.
 * De toeslag wordt aan ieder los onderdeel toegevoegd.
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
        for (
            let index = 0;
        index < row.quantity;
        index += 1
        ) {
            pieces.push({
                id,
                length: row.length,
                allowance,
                calculationLength:
                row.length + allowance
            });

            id += 1;
        }
    }

    return pieces;
}

/**
 * Sorteert onderdelen op rekenlengte,
 * van lang naar kort.
 *
 * @param {Array} pieces
 * @returns {Array}
 */
function sortPiecesDescending(pieces) {
    return [...pieces].sort((pieceA, pieceB) => {
        if (
            pieceB.calculationLength !==
            pieceA.calculationLength
        ) {
            return (
                pieceB.calculationLength -
                pieceA.calculationLength
            );
        }

        if (pieceB.length !== pieceA.length) {
            return pieceB.length - pieceA.length;
        }

        return pieceA.id - pieceB.id;
    });
}


/* =========================================================
 *   Algoritmes
 *   ========================================================= */

/**
 * First Fit Decreasing.
 *
 * Onderdelen worden van lang naar kort gesorteerd.
 * Ieder onderdeel wordt vervolgens in de eerste
 * bestaande uitgangslengte geplaatst waarin het past.
 *
 * @param {Array} pieces
 * @param {number} usableLength
 * @returns {Array}
 */
function firstFitDecreasing(
    pieces,
    usableLength
) {
    const sortedPieces =
    sortPiecesDescending(pieces);

    const bars = [];

    for (const piece of sortedPieces) {
        const matchingBar = bars.find(
            (bar) =>
            piece.calculationLength <=
            bar.remainingLength
        );

        if (matchingBar) {
            addPieceToBar(matchingBar, piece);
        } else {
            bars.push(
                createBar(piece, usableLength)
            );
        }
    }

    return bars;
}

/**
 * Best Fit Decreasing.
 *
 * Onderdelen worden van lang naar kort gesorteerd.
 * Ieder onderdeel wordt geplaatst in de bestaande
 * uitgangslengte die na plaatsing de kleinste
 * restlengte overhoudt.
 *
 * @param {Array} pieces
 * @param {number} usableLength
 * @returns {Array}
 */
function bestFitDecreasing(
    pieces,
    usableLength
) {
    const sortedPieces =
    sortPiecesDescending(pieces);

    const bars = [];

    for (const piece of sortedPieces) {
        const matchingBar =
        findBestFittingBar(bars, piece);

        if (matchingBar) {
            addPieceToBar(matchingBar, piece);
        } else {
            bars.push(
                createBar(piece, usableLength)
            );
        }
    }

    return bars;
}

/**
 * Zoekt de passende staaf die na plaatsing
 * de kleinste restlengte overhoudt.
 *
 * @param {Array} bars
 * @param {{
 *     calculationLength: number
 * }} piece
 * @returns {Object|null}
 */
function findBestFittingBar(bars, piece) {
    let bestBar = null;
    let smallestRemainingLength = Infinity;

    for (const bar of bars) {
        if (
            piece.calculationLength >
            bar.remainingLength
        ) {
            continue;
        }

        const remainingAfterPlacement =
        bar.remainingLength -
        piece.calculationLength;

        if (
            remainingAfterPlacement <
            smallestRemainingLength
        ) {
            bestBar = bar;
            smallestRemainingLength =
            remainingAfterPlacement;
        }
    }

    return bestBar;
}

/**
 * Maakt een nieuwe uitgangslengte aan.
 *
 * @param {Object} piece
 * @param {number} usableLength
 * @returns {{
 *     pieces: Array,
 *     usedLength: number,
 *     remainingLength: number
 * }}
 */
function createBar(piece, usableLength) {
    return {
        pieces: [piece],
        usedLength: piece.calculationLength,
        remainingLength:
        usableLength -
        piece.calculationLength
    };
}

/**
 * Voegt een onderdeel aan een bestaande
 * uitgangslengte toe.
 *
 * @param {Object} bar
 * @param {Object} piece
 */
function addPieceToBar(bar, piece) {
    bar.pieces.push(piece);
    bar.usedLength += piece.calculationLength;
    bar.remainingLength -=
    piece.calculationLength;
}


/* =========================================================
 *   Samenvatting
 *   ========================================================= */

/**
 * Berekent de totalen van een zaagplan.
 *
 * @param {{
 *     stockLength: number,
 *     usableLength: number,
 *     pieces: Array,
 *     cuttingPlan: Array
 * }} data
 *
 * @returns {{
 *     numberOfBars: number,
 *     totalProductLength: number,
 *     totalAllowance: number,
 *     totalUsedLength: number,
 *     totalUsableLength: number,
 *     totalRemainingLength: number,
 *     totalExcludedLength: number,
 *     utilisation: number
 * }}
 */
function calculateSummary(data) {
    const numberOfBars =
    data.cuttingPlan.length;

    const totalProductLength =
    sumValues(
        data.pieces,
        (piece) => piece.length
    );

    const totalAllowance =
    sumValues(
        data.pieces,
        (piece) => piece.allowance
    );

    const totalUsedLength =
    totalProductLength +
    totalAllowance;

    const totalUsableLength =
    numberOfBars *
    data.usableLength;

    const totalRemainingLength =
    totalUsableLength -
    totalUsedLength;

    const excludedLengthPerBar =
    data.stockLength -
    data.usableLength;

    const totalExcludedLength =
    numberOfBars *
    excludedLengthPerBar;

    const utilisation =
    totalUsableLength > 0
    ? (
        totalUsedLength /
        totalUsableLength
    ) * 100
    : 0;

    return {
        numberOfBars,
        totalProductLength,
        totalAllowance,
        totalUsedLength,
        totalUsableLength,
        totalRemainingLength,
        totalExcludedLength,
        utilisation
    };
}

/**
 * Telt waarden uit een lijst bij elkaar op.
 *
 * @param {Array} items
 * @param {Function} getValue
 * @returns {number}
 */
function sumValues(items, getValue) {
    return items.reduce(
        (total, item) =>
        total + getValue(item),
                        0
    );
}


/* =========================================================
 *   Resultaatweergave
 *   ========================================================= */

/**
 * Toont de samenvatting en het zaagplan.
 *
 * @param {Object} result
 */
function renderResult(result) {
    renderSummary(result);
    renderCuttingPlan(result);

    cuttingPlanSection.hidden = false;
}

/**
 * Toont de groene samenvattingskaart.
 *
 * @param {{
 *     pieces: Array,
 *     summary: Object
 * }} result
 */
function renderSummary(result) {
    const summary = result.summary;

    resultContainer.innerHTML = `
    <p class="result-card__label">
    Samenvatting
    </p>

    <h2
    id="resultaat-heading"
    class="result-card__value"
    >
    ${formatNumber(summary.numberOfBars)}
    </h2>

    <p class="result-card__unit">
    ${summary.numberOfBars === 1
        ? "uitgangslengte"
        : "uitgangslengtes"}
        </p>

        <div class="zaag-summary">
        ${createSummaryRow(
            "Aantal onderdelen",
            formatNumber(result.pieces.length)
        )}

        ${createSummaryRow(
            "Productlengte",
            formatMillimetres(
                summary.totalProductLength
            )
        )}

        ${createSummaryRow(
            "Totale toeslag",
            formatMillimetres(
                summary.totalAllowance
            )
        )}

        ${createSummaryRow(
            "Totale rekenlengte",
            formatMillimetres(
                summary.totalUsedLength
            )
        )}

        ${createSummaryRow(
            "Rest bruikbare lengte",
            formatMillimetres(
                summary.totalRemainingLength
            )
        )}

        ${createSummaryRow(
            "Uitgesloten lengte",
            formatMillimetres(
                summary.totalExcludedLength
            )
        )}

        ${createSummaryRow(
            "Benutting",
            `${formatDecimal(
                summary.utilisation
            )}%`
        )}
        </div>
        `;
}

/**
 * Toont alle uitgangslengtes en de gebruikte methode.
 *
 * @param {{
 *     cuttingPlan: Array,
 *     usableLength: number,
 *     methodName: string,
 *     methodLabel: string
 * }} result
 */
function renderCuttingPlan(result) {
    cuttingPlanMethod.textContent =
    `${result.methodLabel} — ${result.methodName}`;

    cuttingPlanContainer.innerHTML = `
    <div class="zaagplan">
    ${result.cuttingPlan
        .map((bar, index) =>
        createBarHtml(
            bar,
            index,
            result.usableLength
        )
        )
        .join("")}
        </div>
        `;
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
    <span class="zaag-summary__label">
    ${escapeHtml(label)}
    </span>

    <span class="zaag-summary__value">
    ${escapeHtml(value)}
    </span>
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
function createBarHtml(
    bar,
    index,
    usableLength
) {
    return `
    <article class="zaagplan-item">
    ${createBarHeaderHtml(bar, index)}

    ${createPiecesListHtml(bar.pieces)}

    ${createCuttingBarHtml(
        bar,
        index,
        usableLength
    )}

    ${createBarDetailsHtml(
        bar,
        usableLength
    )}
    </article>
    `;
}

/**
 * Maakt de kop van één uitgangslengte.
 *
 * @param {Object} bar
 * @param {number} index
 * @returns {string}
 */
function createBarHeaderHtml(bar, index) {
    return `
    <div class="zaagplan-item__header">
    <h3 class="zaagplan-item__title">
    Uitgangslengte ${index + 1}
    </h3>

    <p class="zaagplan-item__rest">
    Rest:
    ${formatMillimetres(
        bar.remainingLength
    )}
    </p>
    </div>
    `;
}

/**
 * Maakt de compacte onderdelenlijst.
 *
 * @param {Array} pieces
 * @returns {string}
 */
function createPiecesListHtml(pieces) {
    const groupedPieces =
    groupPieces(pieces);

    const items = groupedPieces
    .map((group) =>
    createPieceGroupHtml(group)
    )
    .join("");

    return `
    <ul class="zaagplan-item__pieces">
    ${items}
    </ul>
    `;
}

/**
 * Maakt één gegroepeerde onderdelenregel.
 *
 * @param {{
 *     length: number,
 *     allowance: number,
 *     quantity: number
 * }} group
 * @returns {string}
 */
function createPieceGroupHtml(group) {
    const quantityText =
    group.quantity > 1
    ? ` × ${formatNumber(group.quantity)}`
    : "";

    const allowanceText =
    group.allowance > 0
    ? ` — rekenlengte ` +
    `${formatMillimetres(
        group.length +
        group.allowance
    )} per stuk`
    : "";

    return `
    <li class="zaagplan-item__piece">
    ${formatMillimetres(group.length)}
    ${quantityText}
    ${allowanceText}
    </li>
    `;
}

/**
 * Maakt de visuele zaagbalk.
 *
 * @param {Object} bar
 * @param {number} index
 * @param {number} usableLength
 * @returns {string}
 */
function createCuttingBarHtml(
    bar,
    index,
    usableLength
) {
    const piecesHtml = bar.pieces
    .map((piece) =>
    createCuttingBarPieceHtml(
        piece,
        usableLength
    )
    )
    .join("");

    const remainingHtml =
    createRemainingBarHtml(
        bar.remainingLength,
        usableLength
    );

    return `
    <div
    class="zaagbalk"
    aria-label="Visuele indeling van uitgangslengte ${index + 1}"
    >
    ${piecesHtml}
    ${remainingHtml}
    </div>
    `;
}

/**
 * Maakt één onderdeel van de visuele zaagbalk.
 *
 * @param {Object} piece
 * @param {number} usableLength
 * @returns {string}
 */
function createCuttingBarPieceHtml(
    piece,
    usableLength
) {
    const percentage =
    calculatePercentage(
        piece.calculationLength,
        usableLength
    );

    const title =
    piece.allowance > 0
    ? `${formatMillimetres(piece.length)} + ` +
    `${formatMillimetres(piece.allowance)} toeslag`
    : formatMillimetres(piece.length);

    return `
    <div
    class="zaagbalk__deel"
    style="width: ${percentage}%"
    title="${escapeHtml(title)}"
    >
    ${formatMillimetres(piece.length)}
    </div>
    `;
}

/**
 * Maakt het restgedeelte van de visuele zaagbalk.
 *
 * @param {number} remainingLength
 * @param {number} usableLength
 * @returns {string}
 */
function createRemainingBarHtml(
    remainingLength,
    usableLength
) {
    if (remainingLength <= 0) {
        return "";
    }

    const percentage =
    calculatePercentage(
        remainingLength,
        usableLength
    );

    return `
    <div
    class="zaagbalk__rest"
    style="width: ${percentage}%"
    title="${formatMillimetres(
        remainingLength
        )} rest"
        >
        ${formatMillimetres(
            remainingLength
        )}
        </div>
        `;
        }

        /**
         * Maakt de detailregels van één uitgangslengte.
         *
         * @param {Object} bar
         * @param {number} usableLength
         * @returns {string}
         */
        function createBarDetailsHtml(
            bar,
            usableLength
        ) {
            return `
            <div class="zaagplan-item__details">
            <p>
            Gebruikt:
            <strong>
            ${formatMillimetres(
                bar.usedLength
            )}
            </strong>
            </p>

            <p>
            Bruikbaar:
            <strong>
            ${formatMillimetres(
                usableLength
            )}
            </strong>
            </p>

            <p>
            Onderdelen:
            <strong>
            ${formatNumber(
                bar.pieces.length
            )}
            </strong>
            </p>
            </div>
            `;
        }


        /* =========================================================
         *   Foutweergave
         *   ========================================================= */

        /**
         * Toont invoerfouten.
         *
         * @param {string[]} errors
         */
        function showErrors(errors) {
            errorContainer.innerHTML = `
            <p>
            <strong>
            Controleer de invoer:
            </strong>
            </p>

            <ul>
            ${errors
                .map(
                    (error) =>
                    `<li>${escapeHtml(error)}</li>`
                )
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
         * Zet de resultaten terug naar de beginstatus.
         */
        function showEmptyResult() {
            resultContainer.innerHTML = `
            <p class="result-card__label">
            Samenvatting
            </p>

            <h2 id="resultaat-heading">
            Nog niets berekend
            </h2>

            <p>
            Controleer de invoer en probeer
            het opnieuw.
            </p>
            `;

            cuttingPlanSection.hidden = true;
            cuttingPlanContainer.innerHTML = "";
            cuttingPlanMethod.textContent = "";
        }


        /* =========================================================
         *   Groeperen en rekenen
         *   ========================================================= */

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
                const key =
                `${piece.length}-${piece.allowance}`;

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
         * Berekent een percentage.
         *
         * @param {number} value
         * @param {number} total
         * @returns {number}
         */
        function calculatePercentage(value, total) {
            if (total <= 0) {
                return 0;
            }

            return (value / total) * 100;
        }


        /* =========================================================
         *   Formatteren en veiligheid
         *   ========================================================= */

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
         * Formatteert gehele getallen volgens
         * Nederlandse schrijfwijze.
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
         * Voorkomt dat tekst als HTML wordt uitgevoerd.
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
