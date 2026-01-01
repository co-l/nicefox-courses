# Spécification - Application de Gestion de Stock Alimentaire

## Vue d'ensemble

Application web permettant de gérer un stock de nourriture personnel avec deux modes d'utilisation :
1. **Phase pré-courses** : Inventaire du stock actuel à domicile
2. **Phase courses** : Liste d'achats à effectuer en magasin

---

## Entités

### Élément (Item)

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique |
| `name` | string | Nom de l'élément (ex: "Carottes") |
| `targetQuantity` | number | Quantité cible à avoir en stock |
| `currentQuantity` | number | Quantité actuelle en stock |
| `unit` | string | Unité de mesure (ex: "kg", "pièces", "paquets") |
| `homeLocation` | string | Emplacement dans la maison (ex: "Réfrigérateur", "Placard cuisine") |
| `homeOrder` | number | Ordre de tri pour la phase pré-courses |
| `storeSection` | string | Rayon du magasin (ex: "Fruits et légumes", "Épicerie") |
| `storeOrder` | number | Ordre de tri pour la phase courses |

### Session de courses (ShoppingSession)

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique |
| `createdAt` | datetime | Date de création |
| `status` | enum | `pre-shopping` \| `shopping` \| `completed` |
| `items` | ShoppingItem[] | Liste des éléments pour cette session |

### Élément de session (ShoppingItem)

| Champ | Type | Description |
|-------|------|-------------|
| `itemId` | string | Référence vers l'élément |
| `countedQuantity` | number \| null | Quantité comptée lors du pré-courses |
| `toBuy` | number | Quantité à acheter (calculé) |
| `purchased` | boolean | Acheté ou non |

---

## Fonctionnalités

### 1. Gestion des éléments (CRUD)

- Créer un nouvel élément avec tous ses attributs
- Modifier un élément existant
- Supprimer un élément
- Lister tous les éléments

### 2. Phase pré-courses

**Objectif** : Compter le stock actuel de chaque élément

- Affichage des éléments triés par `homeOrder` (position dans la maison)
- Groupement par `homeLocation` pour faciliter l'inventaire
- Pour chaque élément :
  - Afficher le nom, l'unité et la quantité cible
  - Champ de saisie pour entrer la quantité comptée
- Calcul automatique de la quantité à acheter : `toBuy = targetQuantity - countedQuantity`
- Bouton pour passer à la phase courses

### 3. Phase courses

**Objectif** : Parcourir la liste d'achats et cocher les éléments achetés

- Affichage uniquement des éléments avec `toBuy > 0`
- Tri par `storeOrder` (ordre des rayons du magasin)
- Groupement par `storeSection` pour suivre le parcours en magasin
- Pour chaque élément :
  - Afficher le nom, la quantité à acheter et l'unité
  - Checkbox pour marquer comme acheté
- Indicateur de progression (X/Y éléments achetés)
- Bouton pour terminer la session

### 4. Finalisation de session

- Mise à jour automatique de `currentQuantity` pour les éléments achetés
- Archivage de la session
- Retour à l'écran d'accueil

---

## Interfaces utilisateur

### Écran d'accueil

```
+----------------------------------+
|     Stock Alimentaire            |
+----------------------------------+
|                                  |
|  [Nouvelle session de courses]   |
|                                  |
|  [Gérer les éléments]            |
|                                  |
+----------------------------------+
```

### Écran pré-courses

```
+----------------------------------+
|  Inventaire        [Continuer →] |
+----------------------------------+
| 📍 Réfrigérateur                 |
|   Carottes        [___] / 2 kg   |
|   Beurre          [___] / 1 pcs  |
+----------------------------------+
| 📍 Placard cuisine               |
|   Muesli          [___] / 2 paq  |
|   Pâtes           [___] / 3 paq  |
+----------------------------------+
```

### Écran courses

```
+----------------------------------+
|  Liste de courses      3/5 ✓     |
+----------------------------------+
| 🛒 Fruits et légumes             |
|   [ ] Carottes - 1 kg            |
|   [✓] Pommes de terre - 2 kg     |
+----------------------------------+
| 🛒 Épicerie                      |
|   [✓] Muesli - 1 paquet          |
|   [✓] Pâtes - 2 paquets          |
+----------------------------------+
| 🛒 Crèmerie                      |
|   [ ] Beurre - 1 pièce           |
+----------------------------------+
|          [Terminer ✓]            |
+----------------------------------+
```

### Écran gestion des éléments

```
+----------------------------------+
|  Éléments          [+ Ajouter]   |
+----------------------------------+
| Carottes                    [✎]  |
| Pommes de terre             [✎]  |
| Muesli                      [✎]  |
| ...                              |
+----------------------------------+
```

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + TypeScript + Vite |
| Style | Tailwind CSS |
| Backend | Express + TypeScript |
| Base de données | NiceFox GraphDB (projet `../nicefox-graphdb`) |
| Authentification | NiceFox Auth (projet `../nicefox-auth`) |

---

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │         stock.nicefox.net           │
                    │                                     │
                    │  ┌───────────────┐  ┌────────────┐  │
                    │  │ React SPA     │  │ Express    │  │
                    │  │ (Tailwind)    │  │ Backend    │  │
                    │  └───────────────┘  └─────┬──────┘  │
                    │                           │         │
                    └───────────────────────────┼─────────┘
                                                │
                    ┌───────────────────────────┼─────────┐
                    │                           ▼         │
                    │  ┌─────────────┐    ┌───────────┐   │
                    │  │ Auth_User   │    │ GraphDB   │   │
                    │  │ (auth)      │    │ (stock)   │   │
                    │  └─────────────┘    └───────────┘   │
                    │       nicefox-graphdb               │
                    └─────────────────────────────────────┘
```

---

## Modèle de données (GraphDB)

### Nœuds

```cypher
(:Stock_User {
  id: String,           # UUID
  authUserId: String,   # Référence vers Auth_User.id
  createdAt: DateTime
})-[:LINKED_TO]->(:Auth_User)

(:Stock_Item {
  id: String,           # UUID
  userId: String,       # Propriétaire de l'élément
  name: String,
  targetQuantity: Float,
  currentQuantity: Float,
  unit: String,
  homeLocation: String,
  homeOrder: Int,
  storeSection: String,
  storeOrder: Int,
  createdAt: DateTime,
  updatedAt: DateTime
})

(:Stock_Session {
  id: String,           # UUID
  userId: String,
  status: String,       # 'pre-shopping' | 'shopping' | 'completed'
  createdAt: DateTime,
  completedAt: DateTime?
})

(:Stock_SessionItem {
  id: String,           # UUID
  sessionId: String,
  itemId: String,
  countedQuantity: Float?,
  toBuy: Float,
  purchased: Boolean
})
```

### Relations

```cypher
(:Stock_User)-[:OWNS]->(:Stock_Item)
(:Stock_User)-[:HAS_SESSION]->(:Stock_Session)
(:Stock_Session)-[:CONTAINS]->(:Stock_SessionItem)
(:Stock_SessionItem)-[:REFERS_TO]->(:Stock_Item)
```

---

## Structure du projet

```
stock-app/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express entry point
│   │   ├── config.ts             # Environment config
│   │   ├── routes/
│   │   │   ├── items.ts          # CRUD éléments
│   │   │   └── sessions.ts       # Gestion des sessions
│   │   ├── services/
│   │   │   ├── item.ts           # Logique métier éléments
│   │   │   └── session.ts        # Logique métier sessions
│   │   ├── db/
│   │   │   ├── graphdb.ts        # Connexion NiceFox GraphDB
│   │   │   ├── itemQueries.ts    # Requêtes Cypher éléments
│   │   │   └── sessionQueries.ts # Requêtes Cypher sessions
│   │   ├── middleware/
│   │   │   └── auth.ts           # Middleware JWT (copié de nicefox-auth/shared)
│   │   └── types/
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx               # Router
│   │   ├── pages/
│   │   │   ├── Home.tsx          # Écran d'accueil
│   │   │   ├── Items.tsx         # Gestion des éléments
│   │   │   ├── ItemForm.tsx      # Formulaire ajout/édition
│   │   │   ├── PreShopping.tsx   # Phase pré-courses
│   │   │   └── Shopping.tsx      # Phase courses
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── ItemCard.tsx
│   │   │   ├── SessionProgress.tsx
│   │   │   └── LocationGroup.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   └── api.ts            # Appels API (axios)
│   │   └── types/
│   │       └── index.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── .env.example
├── .gitignore
└── README.md
```

---

## API Endpoints

### Items (`/api/items`)

| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/` | Liste tous les éléments de l'utilisateur |
| GET | `/:id` | Récupère un élément par ID |
| POST | `/` | Crée un nouvel élément |
| PUT | `/:id` | Met à jour un élément |
| DELETE | `/:id` | Supprime un élément |

### Sessions (`/api/sessions`)

| Méthode | Path | Description |
|---------|------|-------------|
| GET | `/current` | Récupère la session en cours (si existante) |
| POST | `/` | Crée une nouvelle session de courses |
| PATCH | `/:id/status` | Change le statut de la session |
| PATCH | `/:id/items/:itemId` | Met à jour un élément de session (quantité comptée, acheté) |
| POST | `/:id/complete` | Finalise la session et met à jour le stock |

---

## Authentification

L'application utilise le service central `nicefox-auth` :

1. **Redirection** : Si pas de cookie JWT valide, redirection vers `auth.nicefox.net/login?redirect=stock.nicefox.net`
2. **Middleware** : Copier `shared/` de nicefox-auth pour vérifier le JWT
3. **Utilisateur local** : Créer `Stock_User` au premier login, lié à `Auth_User` via `authUserId`

```typescript
// backend/src/middleware/auth.ts (copié de nicefox-auth/shared)
import { authMiddleware } from './shared/auth/middleware'

app.use('/api', authMiddleware({ jwtSecret: process.env.JWT_SECRET }))
```

---

## Variables d'environnement

```env
# Backend
PORT=3000
NODE_ENV=development

# GraphDB
GRAPHDB_URL=http://localhost:3000
GRAPHDB_PROJECT=stock
GRAPHDB_API_KEY=

# Auth (partagé avec nicefox-auth)
AUTH_SERVICE_URL=https://auth.nicefox.net
JWT_SECRET=

# Frontend (via Vite)
VITE_API_URL=http://localhost:3000/api
VITE_AUTH_URL=https://auth.nicefox.net
```

---

## Exemples de requêtes Cypher

### Créer un élément

```cypher
CREATE (i:Stock_Item {
  id: $id,
  userId: $userId,
  name: $name,
  targetQuantity: $targetQuantity,
  currentQuantity: $currentQuantity,
  unit: $unit,
  homeLocation: $homeLocation,
  homeOrder: $homeOrder,
  storeSection: $storeSection,
  storeOrder: $storeOrder,
  createdAt: datetime(),
  updatedAt: datetime()
})
RETURN i
```

### Lister les éléments par emplacement (pré-courses)

```cypher
MATCH (i:Stock_Item {userId: $userId})
RETURN i
ORDER BY i.homeOrder
```

### Créer une session avec ses éléments

```cypher
// 1. Créer la session
CREATE (s:Stock_Session {
  id: $sessionId,
  userId: $userId,
  status: 'pre-shopping',
  createdAt: datetime()
})
RETURN s

// 2. Créer les éléments de session
MATCH (i:Stock_Item {userId: $userId})
CREATE (si:Stock_SessionItem {
  id: $itemId,
  sessionId: $sessionId,
  itemId: i.id,
  countedQuantity: null,
  toBuy: 0,
  purchased: false
})
RETURN si
```

### Finaliser une session

```cypher
// Mettre à jour le stock pour les éléments achetés
MATCH (si:Stock_SessionItem {sessionId: $sessionId, purchased: true})
MATCH (i:Stock_Item {id: si.itemId})
SET i.currentQuantity = i.currentQuantity + si.toBuy,
    i.updatedAt = datetime()
RETURN i
```

---

## Flux utilisateur principal

```
┌─────────────────┐
│   Accueil       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pré-courses    │  Tri par homeOrder
│  (Inventaire)   │  Groupé par homeLocation
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Courses      │  Tri par storeOrder
│  (Liste achat)  │  Groupé par storeSection
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Finalisation   │  Mise à jour du stock
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Accueil       │
└─────────────────┘
```

---

## Évolutions futures possibles

- Historique des sessions de courses
- Suggestions basées sur la consommation moyenne
- Export/import des données
- Synchronisation multi-appareils (déjà possible via GraphDB)
- Scan de code-barres pour ajouter des éléments
- Intégration avec des listes de recettes
- Partage de liste entre utilisateurs (multi-utilisateur par foyer)
