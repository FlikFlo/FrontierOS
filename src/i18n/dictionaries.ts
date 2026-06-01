import type { Locale } from './config'

/* Translation dictionaries. `en` is the source of truth for the shape; `fr`
   must match it (enforced by the `typeof en` annotation below). Look-ups are
   dotted paths (e.g. "nav.sections.sales"); `{var}` placeholders interpolate. */

const en = {
  nav: {
    dashboard: 'Dashboard',
    clients: 'Clients',
    deals: 'Deals',
    orders: 'Orders',
    products: 'Products',
    settings: 'Settings',
    sections: { sales: 'Sales', catalog: 'Catalog', system: 'System' },
  },
  pages: {
    dashboard: { subtitle: 'Overview of key metrics' },
    clients: { subtitle: 'Client and contact base' },
    deals: { subtitle: 'Sales pipeline' },
    orders: { subtitle: 'Orders and their status' },
    products: { subtitle: 'Catalog of goods and services' },
    settings: { subtitle: 'Workspace preferences' },
  },
  placeholder: {
    title: 'Section under construction',
    body: 'The “{title}” module will live here. The Croat design-kit shell is ready — content arrives in the next phases, after Supabase and the CRM schema are wired.',
  },
  data: {
    unconfigured: {
      title: 'Supabase not connected',
      body: 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then apply supabase/schema.sql and seed.sql — data will appear here.',
    },
    empty: { title: 'Nothing here yet', body: 'Run supabase/seed.sql to load demo data.' },
    error: 'Could not load data',
  },
  clients: {
    total: '{count} total',
    columns: { name: 'Name', industry: 'Industry', email: 'Email', phone: 'Phone', status: 'Status' },
    status: { lead: 'Lead', active: 'Active', inactive: 'Inactive' },
  },
  deals: {
    total: '{count} total',
    columns: { title: 'Deal', client: 'Client', stage: 'Stage', amount: 'Amount', probability: 'Prob.', close: 'Expected close' },
    stage: { lead: 'Lead', qualified: 'Qualified', proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost' },
  },
  orders: {
    total: '{count} total',
    columns: { number: 'Order', client: 'Client', status: 'Status', date: 'Date', items: 'Items', total: 'Total' },
    status: { draft: 'Draft', confirmed: 'Confirmed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' },
  },
  products: {
    total: '{count} total',
    columns: { sku: 'SKU', name: 'Name', price: 'Price', unit: 'Unit', state: 'Status' },
    state: { active: 'Active', inactive: 'Archived' },
  },
  roles: {
    owner: 'Owner',
    sales_manager: 'Sales manager',
    brewer: 'Brewer',
  },
  auth: {
    tagline: 'Sign in to your CRM workspace',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signUp: 'Create account',
    toSignUp: 'No account? Create one',
    toSignIn: 'Already have an account? Sign in',
    signOut: 'Sign out',
    pending: 'Please wait…',
    genericError: 'Authentication failed. Check your details and try again.',
    checkEmail: 'Account created. Check your email to confirm, then sign in.',
  },
  a11y: {
    notifications: 'Notifications',
    language: 'Language',
    role: 'Role',
  },
}

/** The dictionary shape; `fr` must satisfy it exactly (structural parity). */
type Dictionary = typeof en

const fr: Dictionary = {
  nav: {
    dashboard: 'Tableau de bord',
    clients: 'Clients',
    deals: 'Affaires',
    orders: 'Commandes',
    products: 'Produits',
    settings: 'Paramètres',
    sections: { sales: 'Ventes', catalog: 'Catalogue', system: 'Système' },
  },
  pages: {
    dashboard: { subtitle: 'Aperçu des indicateurs clés' },
    clients: { subtitle: 'Base de clients et de contacts' },
    deals: { subtitle: 'Pipeline de ventes' },
    orders: { subtitle: 'Commandes et leurs statuts' },
    products: { subtitle: 'Catalogue de biens et services' },
    settings: { subtitle: 'Préférences de l’espace de travail' },
  },
  placeholder: {
    title: 'Section en cours de développement',
    body: 'Le module « {title} » apparaîtra ici. La coque du design-kit Croat est prête — le contenu arrivera dans les prochaines phases, après le branchement de Supabase et du schéma CRM.',
  },
  data: {
    unconfigured: {
      title: 'Supabase non connecté',
      body: 'Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local, puis appliquez supabase/schema.sql et seed.sql — les données apparaîtront ici.',
    },
    empty: { title: 'Rien pour l’instant', body: 'Exécutez supabase/seed.sql pour charger des données de démo.' },
    error: 'Impossible de charger les données',
  },
  clients: {
    total: '{count} au total',
    columns: { name: 'Nom', industry: 'Secteur', email: 'E-mail', phone: 'Téléphone', status: 'Statut' },
    status: { lead: 'Prospect', active: 'Actif', inactive: 'Inactif' },
  },
  deals: {
    total: '{count} au total',
    columns: { title: 'Affaire', client: 'Client', stage: 'Étape', amount: 'Montant', probability: 'Prob.', close: 'Clôture prévue' },
    stage: { lead: 'Piste', qualified: 'Qualifié', proposal: 'Proposition', negotiation: 'Négociation', won: 'Gagné', lost: 'Perdu' },
  },
  orders: {
    total: '{count} au total',
    columns: { number: 'Commande', client: 'Client', status: 'Statut', date: 'Date', items: 'Articles', total: 'Total' },
    status: { draft: 'Brouillon', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' },
  },
  products: {
    total: '{count} au total',
    columns: { sku: 'SKU', name: 'Nom', price: 'Prix', unit: 'Unité', state: 'Statut' },
    state: { active: 'Actif', inactive: 'Archivé' },
  },
  roles: {
    owner: 'Direction',
    sales_manager: 'Responsable commercial',
    brewer: 'Brasseur',
  },
  auth: {
    tagline: 'Connectez-vous à votre espace CRM',
    email: 'E-mail',
    password: 'Mot de passe',
    signIn: 'Se connecter',
    signUp: 'Créer un compte',
    toSignUp: 'Pas de compte ? Créez-en un',
    toSignIn: 'Déjà un compte ? Se connecter',
    signOut: 'Se déconnecter',
    pending: 'Veuillez patienter…',
    genericError: 'Échec de l’authentification. Vérifiez vos informations et réessayez.',
    checkEmail: 'Compte créé. Vérifiez votre e-mail pour confirmer, puis connectez-vous.',
  },
  a11y: {
    notifications: 'Notifications',
    language: 'Langue',
    role: 'Rôle',
  },
}

export const dictionaries: Record<Locale, Dictionary> = { en, fr }
