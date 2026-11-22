# Mon Poulailler

Application web de gestion d'élevage de poulets de chair : bandes, charges, mortalité, ventes et rapports.
Interface en français, montants en F CFA, dates au format jj/mm/aaaa.

## Lancer l'application

Il faut Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Ouvrez ensuite l'adresse affichée, par exemple http://localhost:5173.
L'adresse « Network » permet d'ouvrir l'application depuis un téléphone branché sur le même Wi-Fi.

## Autres commandes

```bash
npm test          # tests des règles de calcul du cahier des charges
npm run build     # version de production, dans le dossier dist
npm run preview   # sert la version de production
```

## Supabase

Les données sont enregistrées dans Supabase, avec une connexion par e-mail.
Chaque compte ne voit que sa propre ferme, grâce à la Row Level Security.

Le fichier `.env` contient l'adresse du projet et la clé publique, au format de `.env.example`.

Avant la première utilisation, il faut installer la base une seule fois :

1. Ouvrez votre projet sur supabase.com, puis **SQL Editor**.
2. Collez tout le contenu de `supabase/schema.sql` et cliquez sur **Run**.
3. Dans **Authentication**, puis **URL Configuration**, mettez `http://localhost:5173` comme **Site URL**.
   Les liens de confirmation reçus par e-mail ramèneront alors vers l'application.

Un nouveau compte commence vide. Le menu Paramètres permet de charger les données d'exemple du cahier des charges,
de télécharger une sauvegarde, de la restaurer ou de tout effacer.

## Organisation du code

- `src/lib/calculs.ts` : toutes les règles de calcul, testées dans `calculs.test.ts`.
- `src/lib/format.ts` : formats français des montants, nombres et dates.
- `src/lib/store.ts` : lecture et écriture des données dans Supabase.
- `src/components/Porte.tsx` : connexion, inscription et mot de passe oublié.
- `src/components/forms/Saisies.tsx` : formulaires de saisie.
- `src/pages/` : un fichier par écran.
