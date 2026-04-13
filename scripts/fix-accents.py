#!/usr/bin/env python3
"""Fix missing French accents across all HTML files.

Uses word boundaries and a negative lookbehind on "/" to avoid touching URL
path segments (e.g. /commander/reservation must NOT become /commander/réservation).
Only replaces whole words.
"""
import re
from pathlib import Path

REPL = {
    # --- simple/common ---
    r"creer":           "créer",
    r"Creer":           "Créer",
    r"creation":        "création",
    r"Creation":        "Création",
    r"creations":       "créations",
    r"creee":           "créée",
    r"cree":            "créé",
    r"etape":           "étape",
    r"etapes":          "étapes",
    r"Etape":           "Étape",
    r"Etapes":          "Étapes",
    r"Derniere":        "Dernière",
    r"derniere":        "dernière",
    r"dernieres":       "dernières",
    r"immediatement":   "immédiatement",
    r"immediat":        "immédiat",
    r"immediate":       "immédiate",
    r"Identite":        "Identité",
    r"identite":        "identité",
    r"Recap":           "Récap",
    r"recap":           "récap",
    r"Selectionnez":    "Sélectionnez",
    r"selectionnez":    "sélectionnez",
    r"Decrivez":        "Décrivez",
    r"decrivez":        "décrivez",
    r"speciales":       "spéciales",
    r"speciale":        "spéciale",
    r"Speciale":        "Spéciale",
    r"Previsualisation":"Prévisualisation",
    r"previsualisation":"prévisualisation",
    r"deploiement":     "déploiement",
    r"saisonnieres":    "saisonnières",
    r"saisonniere":     "saisonnière",
    r"Saisonniere":     "Saisonnière",
    r"fiscalite":       "fiscalité",
    r"Fiscalite":       "Fiscalité",
    r"developper":      "développer",
    r"Decouvrez":       "Découvrez",
    r"decouvre":        "découvre",
    r"decouvrent":      "découvrent",
    r"preferentiel":    "préférentiel",
    r"coordonnees":     "coordonnées",
    r"Evitez":          "Évitez",
    r"evitez":          "évitez",
    r"aupres":          "auprès",
    r"proteger":        "protéger",
    r"perenniser":      "pérenniser",
    r"rembourse":       "remboursé",
    r"Apartment":       "Appartement",
    r"Opera":           "Opéra",
    r"elegance":        "élégance",
    r"elegant":         "élégant",
    r"epure":           "épuré",
    r"activite":        "activité",
    r"activites":       "activités",
    r"genere":          "génère",
    r"generer":         "générer",
    r"frequentes":      "fréquentes",
    r"frequente":       "fréquente",
    r"resolu":          "résolu",
    r"resout":          "résout",
    r"probleme":        "problème",
    r"problemes":       "problèmes",
    r"experience":      "expérience",
    r"experiences":     "expériences",
    r"reduit":          "réduit",
    r"reduisent":       "réduisent",
    r"reduire":         "réduire",
    r"revenus":         "revenus",   # already correct, placeholder
    r"decollent":       "décollent",
    r"controler":       "contrôler",
    r"Controlez":       "Contrôlez",
    r"entierement":     "entièrement",
    r"egalement":       "également",
    r"tres":            "très",
    r"precaution":      "précaution",
    r"resolue":         "résolue",
    r"resolues":        "résolues",
    r"concu":           "conçu",
    r"concue":          "conçue",
    r"demarque":        "démarque",
    r"demarquer":       "démarquer",
    r"demarque":        "démarque",
    # "cle" as in "clé en main" or "Clé API" (but not as part of "article")
    r"Cle":             "Clé",
    # "reservation" / "Reservation" — word boundary + negative lookbehind on "/"
    r"Reservation":     "Réservation",
    r"Reservations":    "Réservations",
    r"reservations":    "réservations",
    r"reservation":     "réservation",
    # Connectives
    r"peut-etre":       "peut-être",
}

# Words whose replacement must NOT happen inside URL paths.
# We apply a negative lookbehind on "/" and "-" to skip slug segments.
URL_UNSAFE = {
    "reservation", "Reservation", "reservations", "Reservations",
    "saisonniere", "saisonnieres", "Saisonniere",
    "creer", "Creer",
    "creation", "Creation",
    "location", "Location",
}

def build_patterns():
    patterns = []
    for src, dst in REPL.items():
        if src in URL_UNSAFE:
            # don't match if preceded by "/" or "-" (slug) or followed by "-" (slug)
            pat = re.compile(rf"(?<![/\-\w]){re.escape(src)}(?![\-\w])")
        else:
            pat = re.compile(rf"\b{re.escape(src)}\b")
        patterns.append((pat, dst))
    return patterns

def fix_file(path: Path, patterns) -> int:
    text = path.read_text(encoding="utf-8")
    original = text
    count = 0
    for pat, dst in patterns:
        new_text, n = pat.subn(dst, text)
        if n:
            count += n
            text = new_text
    if text != original:
        path.write_text(text, encoding="utf-8")
    return count

def main():
    root = Path(__file__).resolve().parent.parent
    html_files = sorted(
        list(root.glob("*.html"))
        + list(root.glob("commander/*.html"))
        + list(root.glob("blog/*.html"))
    )
    patterns = build_patterns()
    total = 0
    for f in html_files:
        n = fix_file(f, patterns)
        if n:
            print(f"  {f.relative_to(root)}: {n} fixes")
            total += n
    print(f"\ntotal: {total} replacements across {len(html_files)} files")

if __name__ == "__main__":
    main()
