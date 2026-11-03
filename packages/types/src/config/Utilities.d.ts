import type { StyleDefinition } from '../blocks';

/**
 * Map utility "type" to its method signature.
 * Extend via module augmentation:
 * declare module '@plone/types' { interface UtilityTypeMap { foo: (id: string) => string } }
 */
export interface UtilityTypeMap {
  validator: ValidatorUtility;
  transform: (data: any) => any;
  fieldFactoryInitialData: (intl: any) => Record<string, any>;
  fieldFactoryProperties: (intl: any) => Record<string, any>;
  styleFieldDefinition: StyleFieldDefinitionUtility;
}

export type ValidatorUtilityArgs = {
  /** The field's value. Validators only run on non-empty values. */
  value: any;
  /** The field's schema property. */
  field: Record<string, any>;
  /** The field's name in the form data. */
  fieldName: string;
  /** All the form's values, for validators that compare fields. */
  formData: any;
  /** Translates a message (i18next). */
  t: (key: string, options?: Record<string, unknown>) => string;
  /**
   * Translates a message descriptor (react-intl style), as validators
   * written for Volto expect.
   */
  formatMessage: (
    message: { id: string; defaultMessage?: string } | string,
    values?: Record<string, unknown>,
  ) => string;
};

/**
 * A field validator, registered as a `validator` utility and matched to
 * fields by its dependencies (`fieldType`, `widget`, `format`,
 * `behaviorName` + `fieldName`, or `blockType` + `fieldName`). Returns an
 * error message, or nothing if the value is valid.
 */
export type ValidatorUtility = (
  options: ValidatorUtilityArgs,
) => string | null | undefined;

export type StyleFieldDefinitionUtilityArgs = {
  data: Record<string, unknown>;
  container?: Record<string, unknown>;
  blockType?: string;
  fieldName: string;
};

export type StyleFieldDefinitionUtility = (
  options: StyleFieldDefinitionUtilityArgs,
) => readonly StyleDefinition[];

type UtilityMethodFor<Type extends string> = Type extends keyof UtilityTypeMap
  ? UtilityTypeMap[Type]
  : (...args: any[]) => any;

export type Utility<Type extends string = string> = Record<
  string,
  { method: UtilityMethodFor<Type> }
>;

type UtilitiesByMap = {
  [Type in keyof UtilityTypeMap]: Utility<Type>;
};

export type UtilitiesConfig = UtilitiesByMap & Record<string, Utility>;
