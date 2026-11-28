/**
 * The key, in the `blocks` field of the content, of the region that holds the
 * page body. Other regions use their slot name, like `aboveContent`.
 */
export const MAIN_REGION = 'main';

/**
 * The `@type` of a region whose `value` is a Plate document. Code finds a
 * region by this type, not by the shape of its key.
 */
export const PLATE_TYPE = 'plate';

/**
 * The key and `@type` that content stored before the page body became the
 * `main` region. Aurora renames it when content is read.
 *
 * @deprecated Use `MAIN_REGION` for the key and `PLATE_TYPE` for the `@type`.
 */
export const SOMERSAULT_KEY = '__somersault__';
