## Hi there 👋
# RekenMaarUit.nl

> **Hoeveel kost een vergadering eigenlijk? Is de fiets sneller dan de auto? Wat levert een kleine besparing per maand op?**
>
> RekenMaarUit.nl is een verzameling praktische online calculators voor alledaagse vragen. Geen zwarte doos die alleen een getal toont, maar hulpmiddelen die ook laten zien **hoe** een uitkomst tot stand komt.

## Over dit project

RekenMaarUit.nl is een persoonlijk hobbyproject waarin praktische calculators worden ontwikkeld én kennis wordt opgedaan over webontwikkeling, Git en GitHub.

De website is bewust gebouwd met HTML, CSS en JavaScript, zonder zware frameworks of onnodige afhankelijkheden. Hierdoor blijft de code overzichtelijk, snel en eenvoudig uit te breiden.

Hoewel het project in de eerste plaats een leertraject is, is het doel om calculators te bouwen die daadwerkelijk bruikbaar, betrouwbaar en transparant zijn.

## Filosofie

Software hoeft niet ingewikkeld te zijn om waardevol te zijn.

Daarom gelden binnen dit project een aantal eenvoudige uitgangspunten:

* Berekeningen moeten controleerbaar en begrijpelijk zijn.
* Eerst een werkende oplossing, daarna verfijnen.
* Geen framework zonder duidelijke meerwaarde.
* Geen database zolang die niet noodzakelijk is.
* Geen betaalde API's zonder bewezen toegevoegde waarde.
* Eenvoud en onderhoudbaarheid gaan vóór technische complexiteit.

Iedere nieuwe calculator moet passen binnen deze filosofie.

## Projectdoelen

* Praktische calculators ontwikkelen voor alledaagse situaties.
* De gebruikte formules en aannames inzichtelijk maken.
* Goed werken op desktop én mobiele apparaten.
* Een eenvoudige codebase behouden waarin nieuwe calculators gemakkelijk kunnen worden toegevoegd.
* Stap voor stap blijven leren en verbeteren.

## Technologie

* HTML5
* CSS3
* Vanilla JavaScript
* Git
* GitHub
* GitHub Pages

## Projectstructuur

```text
.
├── assets/                 Afbeeldingen en iconen
├── css/                    Algemene stylesheets
├── js/                     Algemene JavaScript
├── tools/                  Losse calculators
│   └── vergaderkosten/
├── index.html              Homepage
├── 404.html                Foutpagina
├── robots.txt
├── sitemap.xml
└── CNAME
```

## Lokaal ontwikkelen

Start vanuit de projectmap een eenvoudige webserver:

```bash
python3 -m http.server 8000
```

Open vervolgens:

```text
http://localhost:8000
```

## Publiceren

Wijzigingen worden gepubliceerd via Git.

Gebruik daarbij doorgaans de volgende workflow:

```bash
git status
git add .
git commit -m "Beschrijvende commit"
git pull --rebase origin main
git push
```

Na het pushen publiceert GitHub Pages de website automatisch.

## Roadmap

* [x] Basiswebsite
* [x] Domein gekoppeld
* [x] GitHub Pages ingericht
* [ ] Eerste calculator: *Wat kost deze vergadering?*
* [ ] Herbruikbaar sjabloon voor nieuwe calculators
* [ ] Verbeterde mobiele gebruikerservaring
* [ ] Zoekmachine-optimalisatie
* [ ] Uitbreiding met nieuwe calculators

## Bijdragen

Suggesties, verbeteringen en ideeën zijn welkom. Zie je een fout in een berekening of heb je een idee voor een nieuwe calculator? Open gerust een issue of stuur een voorstel.

