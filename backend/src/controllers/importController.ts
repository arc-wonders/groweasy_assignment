import type { Request, Response } from 'express';
import { z } from 'zod';
import { mapRowsToCrm } from '../services/aiService.js';

const importRequestSchema = z.object({
  rows: z.array(z.record(z.unknown())),
});

export async function importController(req: Request, res: Response) {
  try {
    const parsedBody = importRequestSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({ message: 'Expected a rows array.' });
    }

    const { rows } = parsedBody.data;
    const mappingResults = await mapRowsToCrm(rows);
    const imported = mappingResults.filter((result) => !result.skip && result.record).map((result) => result.record);
    const skipped = mappingResults.filter((result) => result.skip || !result.record);

    return res.json({
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed.';
    return res.status(500).json({ message });
  }
}
