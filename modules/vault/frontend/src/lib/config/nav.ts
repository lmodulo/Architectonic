import { FolderLock } from 'lucide-svelte';

export const vaultNavItems = [
  {
    label:      'Vault',
    href:       '/vault',
    icon:       FolderLock,
    permission: { resource: 'vault_documents', action: 'read' }
  }
];
