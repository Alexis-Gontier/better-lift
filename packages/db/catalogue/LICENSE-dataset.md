# Origine des données du catalogue

`source.json` est un extrait de [exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset),
réduit aux champs utilisés par better-lift et dédupliqué. Les **données** — noms, catégories,
groupes, équipements, cibles, instructions multilingues — sont sous licence MIT :

> MIT License — Copyright (c) 2026 Hasan Emir Yıldırım
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software
> and associated documentation and data files (the "Software"), to deal in the Software without
> restriction, including without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
> BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
> DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Les médias : affichés, jamais copiés (D46)

La MIT ci-dessus **ne couvre pas** les images et les GIF du dataset. Ils appartiennent à
**Gym visual — https://gymvisual.com/**, et n'y sont redistribués qu'en vertu d'une permission
écrite séparée, à trois conditions : résolution 180×180, attribution visible, et — textuellement —
« cloning this repo is not a license ».

better-lift est une application **privée, à trois comptes**, sans public ni monétisation. Le
24 septembre 2026, il a été décidé d'afficher les animations comme le fait opengym, sans les
héberger :

- **aucun média n'est copié** dans ce dépôt ;
- le champ `gif` de `source.json` garde le chemin relatif du dataset (`videos/0001-2gPfomN.gif`) ;
  le semis en fait une URL vers le dépôt du dataset, **figée sur le commit `7455efa`** ;
- chaque animation est affichée en 180×180 au plus, avec la mention **« © Gym visual —
  https://gymvisual.com/ »**.

Si l'application devait s'ouvrir à d'autres, cette décision serait la première à reprendre : il
faudrait alors une licence auprès de Gym visual, ou d'autres médias.
