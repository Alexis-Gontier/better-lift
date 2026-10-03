"""
La coupe condensée d'Archivo pour les chiffres héros du mobile (D103).

React Native sur Android ignore les axes des polices variables, et aucune coupe
condensée n'est publiée pour Expo : on fige donc la police variable officielle
(Google Fonts, licence OFL) à `wdth` 72 et `wght` 700, et on livre le résultat en
TTF statique dans `apps/mobile/assets/polices/`.

À relancer seulement si la coupe change :

    python -m pip install fonttools
    python scripts/polices/condenser-archivo.py <Archivo[wdth,wght].ttf>

La source : https://github.com/google/fonts/tree/main/ofl/archivo
"""

import sys
from pathlib import Path

from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

FAMILLE = "Archivo Condense"
SORTIE = Path(__file__).resolve().parents[2] / "apps/mobile/assets/polices/ArchivoCondense-Bold.ttf"


def main(source: str) -> None:
    police = TTFont(source)
    statique = instantiateVariableFont(police, {"wdth": 72, "wght": 700})

    # Un nom à elle : chargée sous le même nom que l'Archivo d'Expo, elle
    # écraserait la graisse 700 de la police normale.
    noms = statique["name"]
    for ident, valeur in (
        (1, FAMILLE),
        (2, "Bold"),
        (4, f"{FAMILLE} Bold"),
        (6, "ArchivoCondense-Bold"),
        (16, FAMILLE),
        (17, "Bold"),
    ):
        noms.setName(valeur, ident, 3, 1, 0x409)

    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    statique.save(SORTIE)
    print(f"{SORTIE} ({SORTIE.stat().st_size} octets)")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage : condenser-archivo.py <Archivo[wdth,wght].ttf>")
    main(sys.argv[1])
