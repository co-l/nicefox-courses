# Stock Alimentaire

Application web de gestion de stock alimentaire personnel avec deux phases :
1. **Pré-courses** : Inventaire du stock actuel
2. **Courses** : Liste d'achats à cocher en magasin

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS
- **Backend** : Express + TypeScript
- **Base de données** : NiceFox GraphDB
- **Authentification** : NiceFox Auth (OAuth Google)

## Installation

### Prérequis

- Node.js 18+
- NiceFox GraphDB en cours d'exécution sur le port 3300
- NiceFox Auth configuré

### Configuration

1. Copier les fichiers d'environnement :

```bash
cp .env.example backend/.env
cp frontend/.env.example frontend/.env
```

2. Configurer les variables dans `backend/.env` :
   - `GRAPHDB_API_KEY` : Clé API GraphDB pour le projet "stock"
   - `JWT_SECRET` : Secret JWT partagé avec nicefox-auth

### Lancement

```bash
# Backend (port 3000)
cd backend
npm install
npm run dev

# Frontend (port 5173)
cd frontend
npm install
npm run dev
```

## Structure du projet

```
├── backend/
│   └── src/
│       ├── index.ts          # Point d'entrée Express
│       ├── config.ts         # Configuration
│       ├── routes/           # Routes API
│       ├── services/         # Logique métier
│       ├── db/               # Requêtes GraphDB
│       ├── middleware/       # Auth middleware
│       └── types/            # Types TypeScript
├── frontend/
│   └── src/
│       ├── App.tsx           # Router principal
│       ├── pages/            # Pages de l'application
│       ├── components/       # Composants réutilisables
│       ├── contexts/         # Contexte Auth
│       ├── services/         # API client
│       └── types/            # Types TypeScript
└── SPEC.md                   # Spécification complète
```

## Utilisation

1. Se connecter via Google (redirection vers auth.nicefox.net)
2. Ajouter des éléments dans "Gérer les éléments"
3. Démarrer une session de courses
4. Phase inventaire : compter le stock de chaque élément
5. Phase courses : cocher les éléments achetés
6. Terminer la session pour mettre à jour le stock

## API

### Items

- `GET /api/items` - Liste des éléments
- `POST /api/items` - Créer un élément
- `PUT /api/items/:id` - Modifier un élément
- `DELETE /api/items/:id` - Supprimer un élément
- `POST /api/items/reorder` - Réordonner les éléments

### Sessions

- `GET /api/sessions/current` - Session en cours
- `POST /api/sessions` - Nouvelle session
- `PATCH /api/sessions/:id/status` - Changer le statut
- `PATCH /api/sessions/:id/items/:itemId` - Mettre à jour un élément
- `POST /api/sessions/:id/complete` - Terminer la session
