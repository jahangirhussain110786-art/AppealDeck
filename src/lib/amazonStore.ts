/**
 * The non-US Amazon store a pasted notice names, as its domain ("Amazon.co.uk"), or null.
 *
 * Only a domain counts: the word "Amazon" with a country name next to it appears in plenty of
 * US notices. This is a hint for a visible note, never a switch: the workspace's marketplace choice
 * decides routing, and silently changing it would send a seller down a different path unseen.
 */
const NON_US_STORE =
  /\bamazon\.(co\.uk|co\.jp|com\.au|com\.mx|com\.br|com\.tr|com\.sg|de|fr|it|es|ca|in|nl|pl|se|ae|sa|eg|sg)\b/i;

export function detectOtherAmazonStore(notice: string): string | null {
  const m = NON_US_STORE.exec(notice);
  return m ? `Amazon.${m[1]!.toLowerCase()}` : null;
}
