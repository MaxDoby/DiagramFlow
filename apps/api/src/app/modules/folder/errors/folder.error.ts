export class FolderNameAlreadyExistsError extends Error {
  constructor() {
    super('Folder name already exists');
    this.name = FolderNameAlreadyExistsError.name;
  }
}

export class FolderNotFoundError extends Error {
  constructor() {
    super('Folder not found');
    this.name = FolderNotFoundError.name;
  }
}
