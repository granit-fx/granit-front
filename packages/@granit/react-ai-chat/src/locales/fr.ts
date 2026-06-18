import type { ChatTranslations } from './en';

export const aiChatTranslationsFr: ChatTranslations = {
  Thread: {
    Empty: 'Posez une question sur votre application.',
    You: 'Vous',
    Assistant: 'Assistant',
    AssistantTyping: 'L’assistant écrit…',
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
};
