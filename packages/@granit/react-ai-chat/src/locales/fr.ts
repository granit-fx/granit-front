import type { ChatTranslations } from './en';

export const aiChatTranslationsFr: ChatTranslations = {
  Thread: {
    Empty: 'Posez une question sur votre application.',
    You: 'Vous',
    Assistant: 'Assistant',
    AssistantTyping: 'L’assistant écrit…',
    ScrollToLatest: 'Aller au dernier message',
  },
  Composer: {
    Placeholder: 'Interrogez votre application… ( / pour les prompts, @ pour mentionner )',
    Send: 'Envoyer',
    Stop: 'Arrêter',
    Attach: 'Joindre un fichier',
    Workspace: 'Espace de travail',
    SearchWorkspaces: 'Rechercher un modèle…',
    RemoveAttachment: 'Supprimer la pièce jointe',
    RemovePrompt: 'Supprimer le prompt',
  },
  Tools: {
    Names: {
      query_data: 'Recherche de données…',
      search: 'Recherche…',
    },
    Fallback: 'Traitement…',
    Thinking: 'Réflexion…',
    Succeeded: 'terminé',
    Failed: 'échec',
  },
  Suggestions: {
    Title: 'Actions suggérées',
  },
  Clarification: {
    Other: 'Autre chose…',
    OtherPlaceholder: 'Saisissez votre réponse',
    Submit: 'Envoyer',
  },
  Pickers: {
    Prompts: 'Prompts',
    Mentions: 'Mentions',
    NoResults: 'Aucun résultat',
    Loading: 'Recherche…',
  },
  Errors: {
    RateLimit: 'Vous avez atteint la limite de requêtes. Patientez un instant puis réessayez.',
    Server: 'L’assistant a rencontré un problème. Veuillez réessayer.',
    Network: 'Connexion perdue. Vérifiez votre réseau puis réessayez.',
    Unknown: 'Une erreur est survenue. Veuillez réessayer.',
    Retry: 'Réessayer',
  },
};
