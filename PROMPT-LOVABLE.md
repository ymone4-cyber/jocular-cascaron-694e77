# CVAN.ONLINE — accueil interactif inspiré du brief Myth Atlas

Utilise les fichiers importés comme base de migration vers une application Lovable. Le brief Myth Atlas fournit une direction artistique de guide de musée interactif : papier sable, grille éditoriale, panneaux fins, une scène 3D centrale, des onglets et une fiche de catalogue. Applique cette direction au contenu réel de CVAN.ONLINE.

## Accueil et cinq images fournies

- La page d’accueil de référence est public/index.html, son module visuel est public/cvan-atlas.js et les cinq visuels locaux sont dans public/assets.
- Intègre les cinq images fournies : logo CVAN, routeur, stylo Bic, livre « Guide CVAN : Stratégies de Croissance » et ordinateur portable.
- Utilise le logo pour la marque, puis les quatre autres photos dans les onglets et la scène interactive comme objets de présentation du parcours.
- Garde une page CVAN en français. Le catalogue explique l’accès en ligne, la prise de notes, le guide et l’évaluation. Ne reprends pas les créatures, marques, textes ou légendes Myth Atlas.
- Reprends le fond papier sable, les panneaux crème, les filets fins, la typographie serif éditoriale associée à une sans-serif et une police monospace, les petits rayons d’angle et le mode soir.
- Garde une plaque photo 3D construite avec Three.js r170. L’utilisateur peut la faire tourner, zoomer, l’agrandir, l’éclairer et sélectionner les cinq visuels. Les commandes au clavier, les onglets, la recherche et le bouton de gros plan doivent fonctionner.
- Les scènes et les textes restent lisibles et accessibles sur téléphone, au clavier et avec le réglage de mouvement réduit. Affiche l’image choisie si WebGL ne démarre pas.
- Les boutons Commencer ouvrent l’évaluation CVAN existante. Espace enseignant et contacts conservent leur navigation. La page peut défiler jusqu’au contenu d’évaluation sous l’accueil.

Les fichiers images intégrés proviennent de la capture fournie. Si les originaux de meilleure résolution sont disponibles dans le projet, utilise-les à la place en conservant les mêmes cinq objets.

## Fonctions CVAN à préserver

- Préserve le parcours étudiant, ses questions, le chronomètre, les résultats, l’attestation et l’envoi de courriel.
- Préserve les évaluations créées par l’enseignant : import des PDF de questions et du corrigé privé, analyse, publication/désactivation, copies soumises, consultation et notation.
- Garde le barème actuel : 3 étapes, 6 questions par étape, 4 réponses justes sur 6 pour valider. Les QCM restent corrigés automatiquement; les réponses rédigées proches suivent le seuil actuel et les cas intermédiaires restent proposés à une vérification manuelle.
- Préserve les quatre thèmes d’icône œil Goku, Naruto, Minato et Kyûbi avec des motifs SVG originaux, sans images ni logos officiels.
- Garde les pages de contact et les boutons de navigation existants.

## Migration et sécurité vers Lovable Cloud

- Remplace les fonctions Netlify et Netlify Blobs par Lovable Cloud : base de données, authentification, stockage privé et fonctions serveur. Aucun parcours publié ne doit dépendre d’une fonction Netlify.
- Configure un seul compte propriétaire et désactive l’inscription publique des enseignants. Demande l’adresse courriel propriétaire dans l’interface Lovable. Ne demande aucun mot de passe dans le chat et ne stocke pas de mot de passe dans le code ou le navigateur.
- Protège chaque donnée et opération privée côté serveur avec les rôles, les règles RLS et les politiques du stockage. Un bouton masqué ou une vérification JavaScript ne protège pas les données.
- Les visiteurs anonymes peuvent voir uniquement les questions de l’évaluation active et envoyer une copie. Ils ne peuvent jamais lire les corrigés, les réponses attendues, les résultats, les copies d’autres étudiants ou les évaluations inactives.
- Le propriétaire seul peut lire ou modifier les corrigés, les copies, les résultats et les réglages privés.
- Valide les soumissions côté serveur et limite les abus. Le PDF des questions n’est public que pendant la publication de son évaluation.
- Adapte la CSP au build Lovable sans autoriser les scripts en ligne de façon générale.

## Données anciennes et vérification

Le ZIP contient le code et les cinq images préparées, pas les enregistrements ni les PDF conservés dans Netlify Blobs. Précise qu’ils restent à exporter puis à réimporter; n’annonce pas leur transfert.

Importe le projet, active Lovable Cloud, construis un aperçu, puis vérifie visuellement l’accueil sur ordinateur et téléphone, les cinq sélections, la navigation, l’évaluation étudiante et les droits du compte propriétaire. Vérifie aussi les règles RLS et de stockage. Résume le résultat et demande seulement les informations manquantes, notamment le courriel propriétaire.
