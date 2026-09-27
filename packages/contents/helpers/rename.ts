export interface RenameEdit {
  '@id': string;
  originalId: string;
  originalTitle: string;
  id: string;
  title: string;
}

export interface RenameItemPayload {
  '@id': string;
  data: { id?: string; title?: string };
  title: string;
}

export function buildRenamePayload(edits: RenameEdit[]): RenameItemPayload[] {
  return edits
    .map((edit) => {
      const data: RenameItemPayload['data'] = {};
      if (edit.id !== edit.originalId) {
        data.id = edit.id;
      }
      if (edit.title !== edit.originalTitle) {
        data.title = edit.title;
      }
      return {
        '@id': edit['@id'],
        data,
        title: edit.title || edit.id,
      };
    })
    .filter((payload) => 'id' in payload.data || 'title' in payload.data);
}
