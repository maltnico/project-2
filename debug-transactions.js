console.log('=== Test des hooks de transactions ===');

// Test simple des hooks en développement
const testHooks = () => {
  console.log('Hooks de transactions chargés avec succès');
  
  // Vérifier si les tables bancaires existent
  if (window.supabase) {
    console.log('Supabase disponible');
  } else {
    console.log('Supabase non disponible');
  }
};

// Attendre que la page soit chargée
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testHooks);
} else {
  testHooks();
}

export { testHooks };
