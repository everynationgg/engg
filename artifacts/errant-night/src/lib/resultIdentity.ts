/** Result playerId is the stable seat ID; callsigns and socket IDs are not identity. */
export function findOwnResult<T extends { playerId: string }>(rows: T[], playerId: string | null | undefined): T | undefined {
  return playerId ? rows.find(row => row.playerId === playerId) : undefined;
}
