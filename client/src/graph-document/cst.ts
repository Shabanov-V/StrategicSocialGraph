import { parseDocument, type Document } from 'yaml';
import { GraphDocumentError } from './types';

/**
 * Parse a YAML string into a comment-preserving CST Document.
 * Throws GraphDocumentError on unparseable input.
 */
export function parse(yamlText: string): Document {
  let doc: Document;
  try {
    doc = parseDocument(yamlText);
  } catch (e) {
    throw new GraphDocumentError(`Invalid YAML: ${(e as Error).message}`);
  }
  if (doc.errors.length > 0) {
    throw new GraphDocumentError(`Invalid YAML: ${doc.errors[0].message}`);
  }
  return doc;
}

/** Serialize a CST Document back to a YAML string, preserving comments. */
export function serialize(doc: Document): string {
  return doc.toString({ lineWidth: 0 });
}
