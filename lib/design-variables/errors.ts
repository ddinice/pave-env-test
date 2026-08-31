export class ForbiddenVariableChangeError extends Error {
  readonly externalKey: string;

  constructor(externalKey: string) {
    super(`Not allowed to change protected variable "${externalKey}".`);
    this.name = "ForbiddenVariableChangeError";
    this.externalKey = externalKey;
  }
}

export class VariableNotFoundError extends Error {
  readonly externalKey: string;

  constructor(externalKey: string) {
    super(`Design variable "${externalKey}" not found.`);
    this.name = "VariableNotFoundError";
    this.externalKey = externalKey;
  }
}
