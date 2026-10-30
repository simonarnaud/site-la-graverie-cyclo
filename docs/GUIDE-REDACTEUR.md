# Guide du rédacteur

Ce guide s'adresse aux bénévoles qui publient sur le site. Aucune connaissance technique n'est nécessaire.

> Captures d'écran à ajouter une fois l'interface en ligne.

## Se connecter (la première fois)

1. Créez un compte gratuit sur [github.com](https://github.com/signup) avec votre email.
2. Envoyez votre nom d'utilisateur GitHub au responsable du site : il vous donnera l'accès.
3. Acceptez l'invitation reçue par email.
4. Ouvrez la page d'administration : lien **« Espace rédaction »** tout en bas de n'importe quelle page du site, ou directement **https://simonarnaud.github.io/site-la-graverie-cyclo/admin/** (à garder en favori).
5. Cliquez sur **« Se connecter avec GitHub »**. Une fenêtre GitHub s'ouvre : connectez-vous si besoin, puis cliquez sur **Authorize** (autoriser). Cette autorisation n'est demandée que la première fois.

Ensuite, votre navigateur se souvient de vous. Si au bout de quelques heures le site vous demande de vous reconnecter, cliquez simplement de nouveau sur « Se connecter avec GitHub ».

Ne cliquez pas sur « Travailler avec un dépôt local » ni sur « Se connecter avec un jeton d'accès » : ces options sont réservées au responsable technique.

## Ajouter un événement au calendrier

1. Menu **Calendrier** → **Nouveau**.
2. Choisissez le **type** : entraînement (sorties du club), rando FSGT, course ou autre. Chaque type a sa couleur sur le site.
   Indiquez aussi la **discipline** si elle est utile : cyclo, VTT ou gravel.
3. Remplissez le titre, la date et l'heure de départ et le lieu.
   Si vous le souhaitez, placez aussi le **point de départ sur la carte** : tapez l'adresse dans la recherche de la carte, ou cliquez à l'endroit exact du départ (un parking, une place…). La fiche de l'activité proposera alors **« Voir sur Google Maps »** et **« Itinéraire »** aux membres. Pour retirer le point, videz le champ.
4. Pour une rando ou une course organisée par un autre club, indiquez l'**organisateur**.
5. **Le parcours** :
   - pour un **entraînement**, choisissez l'un des parcours habituels du club dans « Parcours d'entraînement » ;
   - pour une **rando ou une course**, déposez directement son fichier GPX dans « Trace GPX » : la carte, le profil d'altitude et le téléchargement apparaîtront sur la fiche de l'événement. Inutile de créer un parcours.

   Le menu **Parcours d'entraînement** du CMS ne sert qu'à enregistrer les parcours habituels des entraînements, réutilisés d'une semaine à l'autre.
6. **Participation** : créez d'abord l'événement dans le club Strava, puis collez son lien dans « Lien de l'événement Strava » (dans l'application Strava : Partager → Copier le lien). Les membres indiquent leur participation sur Strava, et l'on voit combien de personnes viennent.
   Pour une rando ou une course organisée ailleurs qui demande une inscription, collez aussi le lien d'inscription de l'organisateur.
7. Si vous le souhaitez, ajoutez une **image d'illustration** (photo du lieu, affiche de la rando…) et sa description. Elle s'affiche sur la carte de l'événement et sur sa fiche.
8. Cliquez sur **Enregistrer**.

Supprimer un événement, un parcours, un album ou un document supprime aussi ses photos et fichiers.

L'événement apparaît dans le calendrier, au mois de sa date ; les visiteurs passent d'un mois à l'autre avec les flèches. Pour annuler un événement, ouvrez-le et cochez **Événement annulé** plutôt que de le supprimer : les membres abonnés au calendrier seront prévenus.

Chaque activité affiche **« Trace GPX »** (trace jointe, ou parcours d'entraînement choisi) ou **« Sans trace GPX »**, sur le site comme dans la liste du menu Calendrier du CMS : pratique pour repérer celles à compléter.

## Ajouter un partenaire

1. Menu **Partenaires** → **Nouveau**.
2. Indiquez le nom du partenaire, son logo et l'adresse de son site (par exemple `https://www.exemple.fr`).
3. Facultatif : un **ordre d'affichage** (le plus petit numéro s'affiche en premier ; sinon, ordre alphabétique).
4. Cliquez sur **Enregistrer**.

Le logo apparaît sur la page **Partenaires** du site ; un clic dessus ouvre le site du partenaire. Le texte de remerciement en haut de la page se modifie dans **Le club › Page Partenaires**.

## Revenir sur le site depuis le CMS

Le bouton rouge **« ← Voir le site »**, en bas à gauche du CMS, ouvre la page d'accueil du site dans le même onglet : le bouton **Précédent** du navigateur ramène au CMS.

## Modifier les informations du club

Menu **Le club › Coordonnées et bureau** : nom du club, **devise** (la phrase en titre de la page d'accueil, « Si tu t’arrêtes de pédaler, tu tombes ! »), slogan, **email de contact** (affiché en bas de chaque page), réseaux sociaux, membres du bureau (uniquement avec leur accord) et lien d'adhésion HelloAsso.

## Publier un document PDF

Par exemple, le programme de la saison envoyé par la FSGT ou le compte rendu de l'assemblée générale.

1. Menu **Documents** → **Nouveau**.
2. Ajoutez un titre, la date et la **section** (Calendriers FSGT, Comptes rendus d'AG, Règlements et statuts, Adhésion et licences, Autres documents), puis choisissez le fichier PDF (10 Mo maximum).
3. Cliquez sur **Enregistrer**.

Le document apparaît dans sa section de la page **Documents** du site, à consulter ou à télécharger. Dans le CMS, le bouton de regroupement de la liste permet d'afficher les documents par section. Si le fichier est trop lourd, réduisez-le d'abord, par exemple avec le site gratuit [iLovePDF](https://www.ilovepdf.com/fr/compresser_pdf).

## Importer un programme FSGT dans le calendrier

Quand la FSGT envoie un programme en PDF, ses activités peuvent être ajoutées au calendrier en quelques clics.

1. Dans le CMS, cliquez sur **📄 Importer un programme FSGT** (en bas à gauche).
2. Choisissez le PDF (ou glissez-le dans le cadre). Il est lu tout de suite : la page affiche les **activités à venir** qu'il contient.
3. Vérifiez la liste :
   - chaque activité cochée « **Ajouter** » sera créée ; décochez celles dont vous ne voulez pas ;
   - **⚠️ Déjà au calendrier** : une activité du même jour et du même club existe déjà. Elle est décochée pour éviter un doublon ; cochez-la seulement s'il s'agit bien d'une autre activité ;
   - corrigez si besoin la date, l'heure (vide = « horaire à préciser »), le titre, le type, la discipline (Cyclo, VTT, Gravel), le lieu ;
   - les **lignes du PDF non comprises** sont listées en rouge avec la raison : ajoutez-les à la main dans le menu Calendrier.
4. Cliquez sur **Créer … activités dans le calendrier**. C'est enregistré ; le site est à jour une à deux minutes plus tard.

Ensuite, complétez les activités dans le menu **Calendrier** (horaire, lieu, trace GPX, lien Strava…), comme n'importe quelle activité.

Bon à savoir :

- vous devez être connecté au CMS avec votre compte GitHub (sinon, la page propose de vous connecter) ;
- les activités passées ne sont pas proposées ; les numéros de téléphone et emails du PDF ne sont pas recopiés ;
- si quelqu'un ajoute la même activité pendant que vous vérifiez, rien n'est créé : elle est signalée, vérifiez et cliquez à nouveau sur « Créer » ;
- si le PDF ne peut pas être lu (scan, mise en page inconnue…), la page explique pourquoi : transmettez-le au responsable du site ;
- l'import ne publie pas le PDF : pour le proposer au téléchargement, ajoutez-le aussi dans **Documents** (section « Calendriers FSGT »).

## Publier une actualité

1. Menu **Actualités** → **Nouveau**.
2. Ajoutez un titre, un résumé d'une phrase et une image de couverture si vous voulez.
3. Écrivez le texte. Vous pouvez insérer des photos dans le texte.
4. Pour préparer un article sans le publier, cochez **Brouillon**.
5. Cliquez sur **Enregistrer**.

## Ajouter des photos d'une sortie

1. Déposez **toutes** les photos dans l'album partagé du club (Google Photos ou autre) et copiez le lien de l'album.
2. Sur le site : menu **Photos** → **Nouveau**.
3. Choisissez **12 photos maximum**, les plus belles, et collez le lien de l'album complet.

Au bout de 12 mois, les photos d'un album sont retirées automatiquement du site pour gagner de la place. L'album reste listé dans « Albums plus anciens », avec leur lien vers l'album complet : **ne supprimez donc jamais l'album Google Photos**.

Les photos sont réduites automatiquement : inutile de les redimensionner avant.

**Droit à l'image** : ne publiez une photo où l'on reconnaît quelqu'un qu'avec son accord, et celui des parents pour un mineur.

## Après avoir enregistré

**Attendez 2 minutes puis rechargez le site** : la mise en ligne n'est pas instantanée. Un bandeau en bas à droite du CMS indique « Mise en ligne en cours… » puis « Mise en ligne terminée ».

**Si un contenu ne peut pas être publié** (lien invalide, image ou fichier manquant…), le bandeau l'indique en rouge, avec le nom de la fiche et l'explication. Ce contenu n'apparaît pas sur le site, mais **tout le reste est publié normalement** : ouvrez la fiche, corrigez, enregistrez.

Le navigateur garde aussi chaque page en mémoire jusqu'à 10 minutes : si une page déjà visitée semble ancienne, forcez son rechargement (**Ctrl + F5** sur ordinateur, ou tirez la page vers le bas sur téléphone).

Si votre modification n'apparaît toujours pas après 10 minutes, prévenez le responsable du site. Le site reste en ligne dans sa version précédente : vous ne pouvez rien casser.

## Contact

Une question ou un problème ? Écrivez aux responsables du site : lagraveriecyclos@gmail.com
