export class DiagramFolderNotFoundError extends Error {
  constructor() {
    super('Diagram folder not found');
    this.name = DiagramFolderNotFoundError.name;
  }
}

export class DiagramNotFoundError extends Error {
  constructor() {
    super('Diagram not found');
    this.name = DiagramNotFoundError.name;
  }
}

export class DiagramVersionConflictError extends Error {
  constructor() {
    super('Diagram version conflict');
    this.name = DiagramVersionConflictError.name;
  }
}
