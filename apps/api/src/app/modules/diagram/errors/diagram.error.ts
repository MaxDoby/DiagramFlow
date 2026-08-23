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

export class DiagramCollaboratorNotFoundError extends Error {
  constructor() {
    super('Diagram collaborator not found');
    this.name = DiagramCollaboratorNotFoundError.name;
  }
}

export class DiagramAlreadySharedError extends Error {
  constructor() {
    super('Diagram is already shared with this user');
    this.name = DiagramAlreadySharedError.name;
  }
}

export class DiagramOwnerCannotBeCollaboratorError extends Error {
  constructor() {
    super('Diagram owner cannot be added as collaborator');
    this.name = DiagramOwnerCannotBeCollaboratorError.name;
  }
}
