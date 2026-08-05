export class DiagramFolderNotFoundError extends Error {
  constructor() {
    super('Diagram folder not found');
    this.name = DiagramFolderNotFoundError.name;
  }
}
