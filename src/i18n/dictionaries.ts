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
  clients: {
    total: '{count} total',
    columns: { name: 'Name', industry: 'Industry', email: 'Email', phone: 'Phone', status: 'Status' },
    status: { lead: 'Lead', active: 'Active', inactive: 'Inactive' },
    empty: {
      title: 'No clients yet',
      body: 'Run supabase/seed.sql to load demo data, or add your first client.',
    },
    unconfigured: {
      title: 'Supabase not connected',
      body: 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then apply supabase/schema.sql and seed.sql — clients will appear here.',
    },
    error: 'Could not load clients',
  },
  a11y: {
    notifications: 'Notifications',
    language: 'Language',
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
  clients: {
    total: '{count} au total',
    columns: { name: 'Nom', industry: 'Secteur', email: 'E-mail', phone: 'Téléphone', status: 'Statut' },
    status: { lead: 'Prospect', active: 'Actif', inactive: 'Inactif' },
    empty: {
      title: 'Aucun client',
      body: 'Exécutez supabase/seed.sql pour charger des données de démo, ou ajoutez votre premier client.',
    },
    unconfigured: {
      title: 'Supabase non connecté',
      body: 'Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local, puis appliquez supabase/schema.sql et seed.sql — les clients apparaîtront ici.',
    },
    error: 'Impossible de charger les clients',
  },
  a11y: {
    notifications: 'Notifications',
    language: 'Langue',
  },
}

export const dictionaries: Record<Locale, Dictionary> = { en, fr }
